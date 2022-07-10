import { CoverageReport, JsonSummary, ReportNumbers } from './JsonSummary';

const defaultReportNumbers: ReportNumbers = {
      total: 100,
      covered: 5,
      pct: 5,
      skipped: 0,
}

const createMockReportNumbers = (overwrites: Partial<ReportNumbers> = {}): ReportNumbers => ({
  ...defaultReportNumbers,
  ...overwrites
});

const defaultReport: CoverageReport = {
  lines: createMockReportNumbers(),
  statements: createMockReportNumbers(),
  functions: createMockReportNumbers(),
  branches: createMockReportNumbers(),
}

const createMockCoverageReport = (overwrites: Partial<CoverageReport> = {}): CoverageReport => ({
  ...defaultReport,
  ...overwrites,
} as CoverageReport);

const defaultJsonSummary: JsonSummary = {
  total: createMockCoverageReport({
    statements: createMockReportNumbers({
      total: 100,
      covered: 10,
      pct: 10,
    }),
    branches: createMockReportNumbers({
      total: 100,
      covered: 20,
      pct: 20,
    }),
    functions: createMockReportNumbers({
      total: 100,
      covered: 30,
      pct: 30,
    }),
    lines: createMockReportNumbers({
      total: 100,
      covered: 40,
      pct: 40,
    }),
  })
};

const createMockJsonSummary = (overwrites: Partial<JsonSummary> = {}): JsonSummary => ({
  ...defaultJsonSummary,
  ...overwrites,
} as JsonSummary);

export {
  createMockJsonSummary,
  createMockReportNumbers,
  createMockCoverageReport
};
