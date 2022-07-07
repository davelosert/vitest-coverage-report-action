import * as path from 'path';
import { generateBlobFileUrl } from './generateFileUrl';
import { getUncoveredLinesFromStatements } from './getUncoveredLinesFromStatements';
import { JsonFinal } from './types/JsonFinal';
import { JsonSummary } from './types/JsonSummary';
import { Thresholds } from './types/Threshold';
import { oneLine, safeHtml } from 'common-tags';

type Sources = {
  jsonSummary: JsonSummary;
  jsonFinal: JsonFinal;
  thresholds?: Thresholds;
}

const workspacePath = process.cwd();
const generateFileCoverageHtml = ({ jsonSummary, jsonFinal, thresholds = {} }: Sources) => {
  const filePaths = Object.keys(jsonFinal);
  const reportData = filePaths.map((filePath) => {
    const coverage = jsonSummary[filePath];
    const uncoveredLines = getUncoveredLinesFromStatements(jsonFinal[filePath])
    const relativeFilePath = path.relative(workspacePath, filePath);
    const url = generateBlobFileUrl(relativeFilePath);
    
    return `
      <tr align="left"><a href="${relativeFilePath}">${url}</a></tr>
      <tr align="right">${coverage.statements.pct}%</tr>
      <tr align="right">${coverage.branches.pct}%</tr>
      <tr align="right">${coverage.functions.pct}%</tr>
      <tr align="right">${coverage.lines.pct}%</tr>
      <tr align="left">${uncoveredLines.map((range) => {
        let end = '';
        let endUrl = '';

        if(range.start !== range.end) {
          end = `-${range.end}`;
          endUrl = `-L${range.end}`;
        }
        
        const rangeUrl = `${url}#L${range.start}${endUrl}`;

        return `<a href="${rangeUrl}">${range.start}${end}</a>`;
      }).join(', ')}</tr>
      `
    });

  return oneLine`
    <table>
      <thead>
        <tr>
         <th align="left">File</th>
         <th align="right">Stmts</th>
         <th align="right">% Branch</th>
         <th align="right">% Funcs</th>
         <th align="right">% Lines</th>
         <th align="left">Uncovered Lines</th>
        </tr>
      </thead>
      <tbody>
      ${ reportData }
      </tbody>
    </table>
  `
}

export {
  generateFileCoverageHtml
};
