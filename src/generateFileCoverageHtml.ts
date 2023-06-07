import * as path from 'path'
import { generateBlobFileUrl } from './generateFileUrl'
import { LineRange, getUncoveredLinesFromStatements } from './getUncoveredLinesFromStatements'
import { JsonFinal } from './types/JsonFinal'
import { JsonSummary } from './types/JsonSummary'
import { oneLine } from 'common-tags'
import { FileCoverageMode } from './FileCoverageMode'

type FileCoverageInputs = {
	jsonSummary: JsonSummary;
	jsonFinal: JsonFinal;
	fileCoverageMode: FileCoverageMode;
	pullChanges: string[];
}

const workspacePath = process.cwd();
const generateFileCoverageHtml = ({ jsonSummary, jsonFinal, fileCoverageMode, pullChanges }: FileCoverageInputs) => {
	const filePaths = Object.keys(jsonSummary).filter((key) => key !== 'total');

	const formatFileLine = (filePath: string) => {
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
        <td align="left">${createRangeURLs(uncoveredLines, url)}</td>
		
      </tr>`
	}

	let reportData: string = ''
	
	const [changedFiles, unchangedFiles] = splitFilesByChangeStatus(filePaths, pullChanges);

	if (changedFiles.length > 0) {
		reportData += `
			${formatGroupLine('Changed Files')} 
			${changedFiles.map(formatFileLine).join('')}
		`
	};
	
	if(fileCoverageMode === FileCoverageMode.All && unchangedFiles.length > 0) {
		reportData += `
			${formatGroupLine('Unchanged Files')}
			${unchangedFiles.map(formatFileLine).join('')}
		`
	}

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
      ${reportData}
      </tbody>
    </table>
  `
}

function formatGroupLine (caption: string): string { 
	return `
		<tr>
			<td align="left" rowspan="6"><b>${caption}</b></td>
		</tr>
	`
}

function createRangeURLs(uncoveredLines: LineRange[], url: string): string {
	return uncoveredLines.map((range) => {
			let end = '';
			let endUrl = '';

			if (range.start !== range.end) {
				end = `-${range.end}`;
				endUrl = `-L${range.end}`;
			}

			return `<a href="${url}${endUrl}" class="text-red">${range.start}${end}</a>`;
		})
		.join(', ');
}

function splitFilesByChangeStatus(filePaths: string[], pullChanges: string[]): [string[], string[]] {
	return filePaths.reduce(([changedFiles, unchangedFiles], filePath) => {
		if (pullChanges.includes(filePath)) {
			changedFiles.push(filePath)
		} else {
			unchangedFiles.push(filePath)
		}
		return [changedFiles, unchangedFiles];
	}, [[], []] as [string[], string[]]);
}

export {
	generateFileCoverageHtml
};
