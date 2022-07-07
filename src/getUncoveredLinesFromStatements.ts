import { StatementCoverageReport } from './types/JsonFinal';

type LineRange = {
  start: number,
  end: number
};

const getUncoveredLinesFromStatements = ({ s, statementMap }: StatementCoverageReport): LineRange[] => {
  const keys = Object.keys(statementMap);
  
  const uncoveredLineRanges = keys.reduce<LineRange[]>((acc, key) => {
    if(s[key] === 0) {
      const lastRange = acc.at(-1);

      if(lastRange && lastRange.end === statementMap[key].start.line - 1) {
         lastRange.end = statementMap[key].end.line;
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

  return uncoveredLineRanges;
}

export {
  getUncoveredLinesFromStatements
};
