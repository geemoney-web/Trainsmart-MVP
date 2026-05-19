export interface TgaQualificationSearchResult {
  code: string;
  title: string;
  status: string;
}

export interface TgaQualificationDetail {
  code: string;
  title: string;
  status: string;
  supersededBy: string | null;
  trainingPackage: { code: string; title: string } | null;
  unitGroups: Array<{ units: Array<{ code: string; title: string }> }>;
}
