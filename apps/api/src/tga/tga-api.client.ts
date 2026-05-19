import { Injectable } from '@nestjs/common';
import {
  TgaQualificationDetail,
  TgaQualificationSearchResult,
} from './dto/tga-qualification.dto';
import { TgaUnitDetail, TgaUnitSearchResult } from './dto/tga-unit.dto';

/**
 * TGA National Register API client.
 *
 * Actual TGA API (discovered from training.gov.au Nuxt app analysis):
 *   Base: https://training.gov.au/api
 *   Search:     GET /search/training/preview?query={q}
 *               → { value: [{ code, id, title }] }  (prefix search on TP codes)
 *   Detail:     GET /training/{code}
 *               → { code, title, type, usageRecommendation, releases, parent, mappingInformation }
 *   Unit grid:  GET /training/{code}/releases/{releaseId}/unitgrid
 *               → { "0": { code, title, usageRecommendation }, "1": {...}, ... }
 *   Unit elems: returned as HTML inside content bundles — not structured JSON.
 *               We extract via lightweight HTML regex parsing.
 */
@Injectable()
export class TgaApiClient {
  private readonly BASE_URL = 'https://training.gov.au/api';
  private readonly DEFAULT_HEADERS = {
    Accept: 'application/json',
    'User-Agent': 'TrainSmartCompliancePlatform/1.0',
  };

  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, { headers: this.DEFAULT_HEADERS });

        if (response.status === 429 || response.status >= 500) {
          const delay = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
          lastError = new Error(`HTTP ${response.status} from TGA API`);
          continue;
        }

        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new Error('fetchWithRetry exhausted all retries');
  }

  private async safeJson(response: Response): Promise<any> {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`TGA API returned non-JSON (status ${response.status}): ${text.slice(0, 200)}`);
    }
  }

  /**
   * Search for qualifications by code or keyword.
   *
   * Strategy:
   * 1. If the query looks like a qualification code (e.g. BSB50120), do a direct
   *    detail lookup — the preview search returns training packages, not qualifications.
   * 2. For general keyword searches, call the full search endpoint and filter by type.
   */
  async searchQualifications(
    query: string,
  ): Promise<TgaQualificationSearchResult[]> {
    const trimmed = query.trim().toUpperCase();

    // Qualification codes: 2-4 uppercase letters followed by 4-6 digits (e.g. BSB50120, CHC33021)
    const isQualCode = /^[A-Z]{2,4}\d{4,6}$/.test(trimmed);

    if (isQualCode) {
      // Direct lookup — much more reliable than search for specific codes
      const detail = await this.getQualificationDetail(trimmed);
      if (!detail) return [];
      return [{ code: detail.code, title: detail.title, status: detail.status }];
    }

    // General keyword search — use the full search endpoint and filter for qualifications
    const url = `${this.BASE_URL}/search/training?query=${encodeURIComponent(query)}&pageSize=20`;
    try {
      const response = await this.fetchWithRetry(url);
      const json: any = await response.json();
      const items: any[] = json?.data ?? json?.value ?? json?.results ?? [];
      return items
        .filter(
          (item: any) =>
            item.type?.toLowerCase() === 'qualification' ||
            /^[A-Z]{2,4}\d{4,6}$/.test(item.code ?? ''),
        )
        .slice(0, 10)
        .map((item: any) => ({
          code: item.code ?? '',
          title: item.title ?? '',
          status: item.usageRecommendation ?? item.currency ?? 'unknown',
        }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch full qualification detail by code.
   * Returns null if the code is not found (404).
   * Fetches release units from the unitgrid endpoint.
   */
  async getQualificationDetail(
    code: string,
  ): Promise<TgaQualificationDetail | null> {
    const url = `${this.BASE_URL}/training/${encodeURIComponent(code)}`;
    const response = await this.fetchWithRetry(url);

    if (response.status === 404) {
      return null;
    }

    const item: any = await response.json();

    // Verify this is actually a qualification
    if (item.type && item.type !== 'qualification') {
      return null;
    }

    // Get units from unit grid if there's a release
    const unitGroups: Array<{ units: Array<{ code: string; title: string }> }> =
      [];
    const latestRelease = item.releases?.[0];

    if (latestRelease?.id) {
      const gridUrl = `${this.BASE_URL}/training/${encodeURIComponent(code)}/releases/${latestRelease.id}/unitgrid`;
      try {
        const gridResp = await this.fetchWithRetry(gridUrl);
        if (gridResp.status === 200) {
          const gridData: any = await gridResp.json();
          const units = Object.values(gridData).map((u: any) => ({
            code: u.code ?? '',
            title: u.title ?? '',
          }));
          if (units.length > 0) {
            unitGroups.push({ units });
          }
        }
      } catch {
        // Unit grid fetch failed — continue without unit data
      }
    }

    // Superseded-by comes from mappingInformation where mapsToCode points forward
    const supersededBy = this.extractSupersededBy(item);

    // Training package from parent (TGA structure: qual → parent is TP)
    const trainingPackage = item.parent
      ? { code: item.parent.code ?? '', title: item.parent.title ?? '' }
      : null;

    return {
      code: item.code ?? code,
      title: item.title ?? '',
      status: item.usageRecommendation ?? 'unknown',
      supersededBy,
      trainingPackage,
      unitGroups,
    };
  }

  /**
   * Fetch unit detail by code.
   * Returns null if not found (404).
   * Elements/PCs are extracted from HTML content (TGA does not expose structured PC data).
   */
  async getUnitDetail(code: string): Promise<TgaUnitDetail | null> {
    const url = `${this.BASE_URL}/training/${encodeURIComponent(code)}`;
    const response = await this.fetchWithRetry(url);

    if (response.status === 404) {
      return null;
    }

    const item: any = await response.json();

    // Verify this is a unit
    if (item.type && item.type !== 'unit') {
      return null;
    }

    const supersededBy = this.extractSupersededBy(item);

    // Get elements from content bundle HTML
    const elements = await this.fetchUnitElements(code, item);

    return {
      code: item.code ?? code,
      title: item.title ?? '',
      status: item.usageRecommendation ?? 'unknown',
      supersededBy,
      elements,
    };
  }

  /**
   * Search for units by keyword.
   * Note: TGA search is a prefix search on training package codes.
   */
  async searchUnits(query: string): Promise<TgaUnitSearchResult[]> {
    const url = `${this.BASE_URL}/search/training/preview?query=${encodeURIComponent(query)}`;
    const response = await this.fetchWithRetry(url);
    const json: any = await response.json();
    const data: any[] = json?.value ?? [];
    return data.map((item: any) => ({
      code: item.code ?? '',
      title: item.title ?? '',
      status: item.usageRecommendation ?? item.currency ?? 'unknown',
    }));
  }

  /**
   * Extract the superseded-by code from TGA mapping information.
   * When a component is superseded, mappingInformation contains entries pointing to its successor.
   * This is a heuristic: we look for the code that this component maps TO (not FROM).
   */
  private extractSupersededBy(item: any): string | null {
    if (!item.mappingInformation?.length) return null;
    const entry = item.mappingInformation.find(
      (m: any) => m.code === item.code && m.mapsToCode && m.mapsToCode !== item.code,
    );
    return entry?.mapsToCode ?? null;
  }

  /**
   * Attempt to extract unit elements and performance criteria from the HTML content bundle.
   * TGA stores elements/PCs in an HTML table (content type 0118).
   * We parse it with lightweight regex since importing a DOM library is not warranted here.
   */
  private async fetchUnitElements(
    code: string,
    item: any,
  ): Promise<
    Array<{
      num: string;
      title: string;
      performanceCriteria: Array<{ num: string; text: string }>;
    }>
  > {
    try {
      const latestRelease = item.releases?.[0];
      if (!latestRelease?.id) return [];

      const releaseUrl = `${this.BASE_URL}/training/${encodeURIComponent(code)}/releases/${latestRelease.id}?include=All`;
      const releaseResp = await this.fetchWithRetry(releaseUrl);
      if (releaseResp.status !== 200) return [];

      const releaseData: any = await releaseResp.json();
      const defaultBundle = releaseData.contentBundles?.find(
        (b: any) => b.typeCode === '0000',
      );
      if (!defaultBundle) return [];

      const bundleResp = await this.fetchWithRetry(
        `${this.BASE_URL}/content/bundle/${defaultBundle.id}`,
      );
      if (bundleResp.status !== 200) return [];

      const bundleData: any = await bundleResp.json();
      const elemItem = bundleData.items?.find(
        (i: any) => i.contentTypeCode === '0118',
      );
      if (!elemItem?.content) return [];

      return this.parseElementsFromHtml(elemItem.content);
    } catch {
      return [];
    }
  }

  /**
   * Parse elements and performance criteria from TGA HTML table.
   * The HTML has rows with element title in left <td> and PC list in right <td>.
   */
  private parseElementsFromHtml(
    html: string,
  ): Array<{
    num: string;
    title: string;
    performanceCriteria: Array<{ num: string; text: string }>;
  }> {
    const elements: Array<{
      num: string;
      title: string;
      performanceCriteria: Array<{ num: string; text: string }>;
    }> = [];

    const stripTags = (s: string) =>
      s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // TGA uses a 4-column table:
    //   col1: element number (rowspan N), col2: element title (rowspan N),
    //   col3: PC number, col4: PC text
    // Continuation rows (within the same element) have only 2 cells (col3+col4).
    // Header/separator rows use colspan and are skipped.
    const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    let currentElement: (typeof elements)[0] | null = null;

    for (const rowMatch of rowMatches) {
      const rowHtml = rowMatch[1];

      // Skip header/separator rows (they use colspan)
      if (/colspan/i.test(rowHtml)) continue;

      const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
        (m) => stripTags(m[1]),
      );

      if (cells.length >= 4) {
        // New element row: [elemNum, elemTitle, pcNum, pcText]
        const elemNum = cells[0];
        const elemTitle = cells[1];
        const pcNum = cells[2];
        const pcText = cells[3];

        if (!elemNum || !elemTitle) continue;

        currentElement = { num: elemNum, title: elemTitle, performanceCriteria: [] };
        elements.push(currentElement);

        if (pcNum && pcText) {
          currentElement.performanceCriteria.push({ num: pcNum, text: pcText });
        }
      } else if (cells.length === 2 && currentElement) {
        // Continuation PC row for current element: [pcNum, pcText]
        const pcNum = cells[0];
        const pcText = cells[1];
        if (pcNum && pcText) {
          currentElement.performanceCriteria.push({ num: pcNum, text: pcText });
        }
      }
    }

    return elements;
  }
}
