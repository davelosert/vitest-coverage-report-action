import { StatementCoverageReport } from './types/JsonFinal';

type LineCoverage = {
  start: number,
  end: number
};

const getUncoveredLinesFromStatements = ({ s, statementMap }: StatementCoverageReport): LineCoverage[] => {
  const keys = Object.keys(statementMap);
  
  const uncoveredLines = keys.reduce<LineCoverage[]>((acc, key) => {
    if(s[key] === 0) {
      const lastLine = acc.at(-1);

      if(lastLine && lastLine.end === statementMap[key].start.line - 1) {
         lastLine.end = statementMap[key].end.line;
         return acc;
      }
      
      return [
        ...acc, 
        {
          start: statementMap[key].start.line,
          end: statementMap[key].end.line
        }
    ]
    }
    return acc;
  }, [])

  return uncoveredLines;
}

export {
  getUncoveredLinesFromStatements
};
