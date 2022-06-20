import { JsonFinal } from './types/JsonFinal';

const getUntestedLinesFromStatements = (jsonFinal: JsonFinal) => {
  const untestedLines: number[] = [];
  const statements = jsonFinal.s;
  for (const statementNumber in statements) {
    if (statements.hasOwnProperty(statementNumber)) {
      const statement = statements[statementNumber];
      if (statement === 0) {
        // push each line between the start and end of the statement
        const start = jsonFinal.statementMap[statementNumber].start;
        const end = jsonFinal.statementMap[statementNumber].end;
        for (let i = start.line; i <= end.line; i++) {
          untestedLines.push(i);
        }
      }
    }
  }
  return untestedLines;
}
