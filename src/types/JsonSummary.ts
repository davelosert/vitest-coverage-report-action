type ReportNumbers = {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
};

type ReportTypes = {
  lines: ReportNumbers;
  statements: ReportNumbers;
  functions: ReportNumbers;
  branches: ReportNumbers;
}

type JsonSummary = {
  total: ReportTypes;
  [filePath: string]: ReportTypes;
}

export type {
  JsonSummary,
  ReportNumbers,
  ReportTypes
};
