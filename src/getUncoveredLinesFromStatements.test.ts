import { describe, it, expect} from 'vitest';
import { getUncoveredLinesFromStatements } from './getUncoveredLinesFromStatements';
import { StatementCoverageReport } from './types/JsonFinal';

describe('getUncoveredLinesFromStatements()', () => {
  it('returns a single line range for only one untested line.', () => {
    const statements: StatementCoverageReport = {
      statementMap: {
        '0': {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 0 }
        }
      },
      s: { '0': 0 }
    };

    const uncoveredLines = getUncoveredLinesFromStatements(statements);
    
    expect(uncoveredLines).toEqual([{
      start: 1,
      end: 1
    }]);
  });
  
  it('returns an empty array if only line is covered.', () => {
    const statements: StatementCoverageReport = {
      statementMap: {
        '0': {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 0 }
        }
      },
      s: { '0': 1 }
    };
    
    const uncoveredLines = getUncoveredLinesFromStatements(statements);
    
    expect(uncoveredLines).toEqual([]);
  });
  
  it('returns a linge range of 3 lines if all statements are uncovered.', () => {
    const statements: StatementCoverageReport = {
      statementMap: {
        '0': {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 0 }
        },
        '1': {
          start: { line: 2, column: 0 },
          end: { line: 2, column: 0 }
        },
        '2': {
          start: { line: 3, column: 0 },
          end: { line: 3, column: 0 }
        }
      },
      s: { '0': 0, '1': 0, '2': 0 }
    };

    const uncoveredLines = getUncoveredLinesFromStatements(statements);
    
    expect(uncoveredLines).toEqual([{
      start: 1,
      end: 3
    }]);
  });
  
  it('returns two line ranges if statements are interrupted by covered line.', () => {
    const statements: StatementCoverageReport = {
      statementMap: {
        '0': {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 0 }
        },
        '1': {
          start: { line: 2, column: 0 },
          end: { line: 2, column: 0 }
        },
        '2': {
          start: { line: 3, column: 0 },
          end: { line: 3, column: 0 }
        },
        '3': {
          start: { line: 4, column: 0 },
          end: { line: 4, column: 0 }
        }
      },
      s: { '0': 0, '1': 1, '2': 0, '3': 0 }
    };

    const uncoveredLines = getUncoveredLinesFromStatements(statements);
    
    expect(uncoveredLines).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 4 }
    ]);
  
  });

});
