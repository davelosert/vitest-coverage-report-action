import { createJsonFinalEntry } from './types/JsonFinalMockFactory';
import { generateFileCoverageHtml } from './generateFileCoverageHtml';
import { getTableLine } from '../test/queryHelper';
import { JsonFinal } from './types/JsonFinal';
import { JsonSummary } from './types/JsonSummary';
import { createMockCoverageReport, createMockJsonSummary, createMockReportNumbers } from './types/JsonSummaryMockFactory';
import { describe, it, expect } from 'vitest';

describe('generateFileCoverageHtml()', () => {
  it('renders the statements, branches, functions and line coverage-percentage of a file.', () => {
      const jsonSummary: JsonSummary = createMockJsonSummary({
        'src/generateFileCoverageHtml.ts': {
          statements: createMockReportNumbers({ pct: 70, }),
          branches: createMockReportNumbers({ pct: 80, }),
          functions: createMockReportNumbers({ pct: 90, }),
          lines: createMockReportNumbers({ pct: 100, }),
        },
      });
      
      const html = generateFileCoverageHtml({
        jsonSummary,
        jsonFinal: {}
      });
      
      const firstTableLine = getTableLine(1, html);
      
      expect(firstTableLine).toContain('70%');
      expect(firstTableLine).toContain('80%');
      expect(firstTableLine).toContain('90%');
      expect(firstTableLine).toContain('100%');
  });
  
  it('renders the line-coverage in the same row as the coverage.', async (): Promise<void> => {
      const jsonSummary: JsonSummary = createMockJsonSummary({
        'src/exampleFile.ts': createMockCoverageReport({
          statements: createMockReportNumbers({ pct: 70, }),
        }),
      });
      const jsonFinal: JsonFinal = {
        ...createJsonFinalEntry('src/exampleFile.ts', [
          { line: 1, covered: false },
          { line: 2, covered: false }
        ]),
      };
    
      const html = generateFileCoverageHtml({
        jsonSummary,
        jsonFinal
      });
      
      const firstTableLine = getTableLine(1, html);
      
      expect(firstTableLine).toContain('70%');
      expect(firstTableLine).toContain('1-2');
  });
});
