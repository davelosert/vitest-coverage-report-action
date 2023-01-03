import { JsonFinal, StatementCoverageReport, StatementMap } from './JsonFinal';

type LineConfig = { line: number, covered: boolean };
const createJsonFinalEntry = (fileName: string, lineConfigs: LineConfig[]): JsonFinal => {
  const statementCoverageReport: StatementCoverageReport = {
    statementMap: lineConfigs.reduce((obj, lineConfig) => ({
      ...obj,
      [lineConfig.line - 1]: {
        start: {
          line: lineConfig.line,
          column: 0
        },
        end: {
          line: lineConfig.line,
          column: 0
        }
      }
    }), {}),
    s: lineConfigs.reduce((obj, lineConfig) => ({
      ...obj,
      [lineConfig.line - 1]: lineConfig.covered ? 1 : 0
    }), {}) 
  };

  return {
    [fileName]: {
      path: fileName,
      all: false,
      ...statementCoverageReport
    }
  }
}

const defaultJsonFinal: JsonFinal = {
  ...createJsonFinalEntry('src/exampleFile.ts', [{line: 1, covered: false}])
};


const createTestJsonFinal = (overwrites: Partial<JsonFinal> = {}): JsonFinal => ({
  ...defaultJsonFinal,
  ...overwrites
} as JsonFinal);

export {
  createTestJsonFinal,
  createJsonFinalEntry
};
