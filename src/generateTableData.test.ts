import { describe, it, expect } from 'vitest';
import { generateTableFrom } from './generateTableData';
import { JsonSummary } from './types/JsonSummary';

describe('generateTableData', () => {
    const mockReport: JsonSummary = {
      total: {
        branches: { covered: 10, skipped: 8, pct: 100, total: 18 },
        functions: { covered: 0, skipped: 0, pct: 100, total: 0 },
        lines: { covered: 8, skipped: 0, pct: 80, total: 10 },
        statements: { covered: 0, skipped: 0, pct: 100, total: 0 }
      }
    }

  it('generates the headline', () => {
    const result = generateTableFrom(mockReport);
    
    expect(result[0]).toEqual(['Status', 'Category', 'Percentage', 'Covered / Total']);
  });
  
  it('adds status blue-circle if no threshold provided.', async (): Promise<void> => {
    const result = generateTableFrom(mockReport);
    
    expect(result[1][0]).toEqual(':large_blue_circle:');
  });

  it('adds green checkmark if percentage is below threshold.', async (): Promise<void> => {
    const result = generateTableFrom(mockReport, {
      lines: 80
    });
    
    expect(result[1][0]).toEqual(':white_check_mark:');
  });
  
  it('adds red-x if percentage is below threshold.', async (): Promise<void> => {
    const result = generateTableFrom(mockReport, {
      lines: 100
    });
    
    expect(result[1][0]).toEqual(':x:');
  });
  
  it('shows all categories', async (): Promise<void> => {
    const result = generateTableFrom(mockReport);
    
    expect(result[1][1]).toEqual('Lines');
    expect(result[2][1]).toEqual('Statements');
    expect(result[3][1]).toEqual('Functions');
    expect(result[4][1]).toEqual('Branches');
  });
  
  it('adds the percentage with a %-sign.', async (): Promise<void> => {
    const result = generateTableFrom(mockReport);
    
    expect(result[1][2]).toEqual('80%');
  });
  
  it('shows the covered / total numbers.', async (): Promise<void> => {
    const result = generateTableFrom(mockReport);
    
    expect(result[1][3]).toEqual('8 / 10');
  });
});
