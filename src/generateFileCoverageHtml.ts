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
}

const workspacePath = process.cwd();
const generateFileCoverageHtml = ({ jsonSummary, jsonFinal }: Sources) => {
  const filePaths = Object.keys(jsonSummary).filter((key) => key !== 'total');
  const reportData: string = filePaths.map((filePath) => {
    const coverageSummary = jsonSummary[filePath];
    const lineCoverage = jsonFinal[filePath];

    // LineCoverage might be empty if coverage-final.json was not provided.
    const uncoveredLines = lineCoverage ? getUncoveredLinesFromStatements(jsonFinal[filePath]) : [];
    const relativeFilePath = path.relative(workspacePath, filePath);
    const url = generateBlobFileUrl(relativeFilePath);
    
    return `
      <tr>
        <td align="left"><a href="${url}">${relativeFilePath}</a></td>
        <td align="right">${coverageSummary.statements.pct}%</td>
        <td align="right">${coverageSummary.branches.pct}%</td>
        <td align="right">${coverageSummary.functions.pct}%</td>
        <td align="right">${coverageSummary.lines.pct}%</td>
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
    }).join('');

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
