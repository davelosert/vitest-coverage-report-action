type ReportNumbers = {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
};

type CoverageReport = {
  lines: ReportNumbers;
  statements: ReportNumbers;
  functions: ReportNumbers;
  branches: ReportNumbers;
}

type JsonSummary = {
  total: CoverageReport;
  [filePath: string]: CoverageReport;
}

export type {
  JsonSummary,
  ReportNumbers,
  CoverageReport
};
