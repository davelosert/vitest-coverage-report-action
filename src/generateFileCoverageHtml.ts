import * as path from 'path';
import { generateBlobFileUrl } from './generateFileUrl';
import { getUncoveredLinesFromStatements } from './getUncoveredLinesFromStatements';
import { JsonFinal } from './types/JsonFinal';
import { JsonSummary } from './types/JsonSummary';
import { Thresholds } from './types/Threshold';
import { oneLine } from 'common-tags';

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
      <tr>
        <td align="left"><a href="${url}">${relativeFilePath}</a></td>
        <td align="right">${coverage.statements.pct}%</td>
        <td align="right">${coverage.branches.pct}%</td>
        <td align="right">${coverage.functions.pct}%</td>
        <td align="right">${coverage.lines.pct}%</td>
        <td align="left">${uncoveredLines.map((range) => {
          let end = '';
          let endUrl = '';

          if(range.start !== range.end) {
            end = `-${range.end}`;
            endUrl = `-L${range.end}`;
          }
          
          const rangeUrl = `${url}#L${range.start}${endUrl}`;

          return `<a href="${rangeUrl}">${range.start}${end}</a>`;
        }).join(', ')}</td>
      </tr>`
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
