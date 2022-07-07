import * as path from 'path';
import { generateBlobFileUrl } from './generateFileUrl';
import { getUncoveredLinesFromStatements } from './getUncoveredLinesFromStatements';
import { JsonFinal } from './types/JsonFinal';
import { CoverageReport, JsonSummary } from './types/JsonSummary';
import { markdownTable } from 'markdown-table';
import { Thresholds } from './types/Threshold';

type Sources = {
  jsonSummary: JsonSummary;
  jsonFinal: JsonFinal;
}

const workspacePath = process.cwd();
const tableHead = ['File', 'Stmts', '% Branch', '% Funcs', '% Lines', 'Uncovered Lines'];
const headOptions = { 
  align: [
  'left', 'right', 'right', 'right', 'right', 'left'
  ]
};

const generateFileBasedReport = ({ jsonSummary, jsonFinal }: Sources, thresholds: Thresholds = {}) => {
  const filePaths = Object.keys(jsonFinal);

  
  const reportData = filePaths.map((filePath) => {
    const coverage = jsonSummary[filePath];
    const uncoveredLines = getUncoveredLinesFromStatements(jsonFinal[filePath])
    const relativeFilePath = path.relative(workspacePath, filePath);
    const url = generateBlobFileUrl(relativeFilePath);
    
    return [
      `[${relativeFilePath}](${url})`,
      `${coverage.statements.pct}%`,
      `${coverage.branches.pct}%`,
      `${coverage.functions.pct}%`,
      `${coverage.lines.pct}%`,
      uncoveredLines.map((range) => {
        let end = '';
        if(range.start !== range.end) {
          end = `-${range.end}`;
        }
        
        const rangeUrl = `${url}#L${range.start}${end}`;

        return `[${range.start}${end}](${rangeUrl})`;
      }).join(', '),
    ]
  });
  
  return markdownTable([
    tableHead,
    ...reportData,
  ], headOptions)

}

export {
  generateFileBasedReport
};
