export interface TgaUnitDetail {
  code: string;
  title: string;
  status: string;
  supersededBy: string | null;
  elements: Array<{
    num: string;
    title: string;
    performanceCriteria: Array<{ num: string; text: string }>;
  }>;
}

export interface TgaUnitSearchResult {
  code: string;
  title: string;
  status: string;
}
