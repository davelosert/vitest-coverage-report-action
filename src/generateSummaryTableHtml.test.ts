import { describe, it, expect } from 'vitest';
import * as core from '@actions/core';
import { generateSummaryTableData, TableData } from './generateSummaryTableHtml';
import { CoverageReport  } from './types/JsonSummary';
import { icons } from './icons';

describe('generateSummaryTabelHtml', () => {
    const mockReport: CoverageReport = {
        branches: { covered: 10, skipped: 8, pct: 100, total: 18 },
        functions: { covered: 0, skipped: 0, pct: 100, total: 0 },
        lines: { covered: 8, skipped: 0, pct: 80, total: 10 },
        statements: { covered: 0, skipped: 0, pct: 100, total: 0 }
  }

  const stringifyTableData = (tableData: TableData) => {
    return tableData;
  }

  it('generates the headline', () => {
    const data = generateSummaryTableData(mockReport);
    const result = stringifyTableData(data);
    
    expect(result).toContain('Status');
    expect(result).toContain('Category');
    expect(result).toContain('Percentage');
    expect(result).toContain('Covered / Total');
  });
  
  it('adds status blue-circle if no threshold provided.', async (): Promise<void> => {
    const tableData = generateSummaryTableData(mockReport);
    const result = stringifyTableData(tableData);

    expect(result).toContain(icons.blue);
  });

  it('adds green-circle  if percentage is below threshold.', async (): Promise<void> => {
    const data = generateSummaryTableData(mockReport, {
      lines: 80
    });

    const result = stringifyTableData(data);

    expect(result).toContain(icons.green);
  });
  
  it('adds red-circle if percentage is below threshold.', async (): Promise<void> => {
    const data = generateSummaryTableData(mockReport, {
      lines: 100
    });
    
    const result = stringifyTableData(data);
    
    expect(result).toContain(icons.red);
  });
  
  it('shows all categories', async (): Promise<void> => {
    const data = generateSummaryTableData(mockReport);
    const result = stringifyTableData(data);

    expect(result).toContain('Lines');
    expect(result).toContain('Statements');
    expect(result).toContain('Functions');
    expect(result).toContain('Branches');
  });
  
  it('adds the percentage with a %-sign.', async (): Promise<void> => {
    const data = generateSummaryTableData(mockReport);
    const result = stringifyTableData(data);

    expect(result).toContain('80%');
  });
  
  it('shows the covered / total numbers.', async (): Promise<void> => {
    const data = generateSummaryTableData(mockReport);
    const result = stringifyTableData(data);
    
    expect(result).toContain('8 / 10');
  });
  
  it('if threshold is given, provides the threshold in the percentage column.', async (): Promise<void> => {
    const data = generateSummaryTableData(mockReport, {
      lines: 100
    });
    
    const result = stringifyTableData(data);
    
    expect(result).toContain('80% / 100%');
  });
});
