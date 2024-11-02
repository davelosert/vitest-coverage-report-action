import * as path from "node:path";
import { oneLine } from "common-tags";
import { FileCoverageMode } from "../inputs/FileCoverageMode";
import type { JsonFinal } from "../types/JsonFinal";
import type { CoverageReport, JsonSummary } from "../types/JsonSummary";
import { generateBlobFileUrl } from "./generateFileUrl";
import { getCompareString } from "./getCompareString";
import {
	type LineRange,
	getUncoveredLinesFromStatements,
} from "./getUncoveredLinesFromStatements";

type FileCoverageInputs = {
	jsonSummary: JsonSummary;
	jsonSummaryCompare: JsonSummary | undefined;
	jsonFinal: JsonFinal;
	fileCoverageMode: FileCoverageMode;
	pullChanges: string[];
	commitSHA: string;
};

const workspacePath = process.cwd();

const generateFileCoverageHtml = ({
	jsonSummary,
	jsonSummaryCompare,
	jsonFinal,
	fileCoverageMode,
	pullChanges,
	commitSHA,
}: FileCoverageInputs) => {
	const filePaths = Object.keys(jsonSummary).filter((key) => key !== "total");

	let reportData = "";

	const [changedFiles, unchangedFiles] = splitFilesByChangeStatus(
		filePaths,
		pullChanges,
	);

	if (
		fileCoverageMode === FileCoverageMode.Changes &&
		changedFiles.length === 0
	) {
		return "No changed files found.";
	}

	if (changedFiles.length > 0) {
		reportData += `
					${formatGroupLine("Changed Files")} 
					${changedFiles
						.map((filePath) =>
							generateRow(
								filePath,
								jsonSummary,
								jsonSummaryCompare,
								jsonFinal,
								commitSHA,
							),
						)
						.join("")}
				`;
	}

	if (fileCoverageMode === FileCoverageMode.All && unchangedFiles.length > 0) {
		reportData += `
						${formatGroupLine("Unchanged Files")}
						${unchangedFiles
							.map((filePath) =>
								generateRow(
									filePath,
									jsonSummary,
									undefined,
									jsonFinal,
									commitSHA,
								),
							)
							.join("")}
				`;
	}

	return oneLine`
		<table>
			<thead>
				<tr>
				 <th align="left">File</th>
				 <th align="right">Stmts</th>
				 <th align="right">Branches</th>
				 <th align="right">Functions</th>
				 <th align="right">Lines</th>
				 <th align="left">Uncovered Lines</th>
				</tr>
			</thead>
			<tbody>
			${reportData}
			</tbody>
		</table>
	`;
};

function generateRow(
	filePath: string,
	jsonSummary: JsonSummary,
	jsonSummaryCompare: JsonSummary | undefined,
	jsonFinal: JsonFinal,
	commitSHA: string,
): string {
	const coverageSummary = jsonSummary[filePath];
	const coverageSummaryCompare = jsonSummaryCompare
		? jsonSummaryCompare[filePath]
		: undefined;
	const lineCoverage = jsonFinal[filePath];

	// LineCoverage might be empty if coverage-final.json was not provided.
	const uncoveredLines = lineCoverage
		? getUncoveredLinesFromStatements(jsonFinal[filePath])
		: [];
	const relativeFilePath = path.relative(workspacePath, filePath);
	const url = generateBlobFileUrl(relativeFilePath, commitSHA);

	return `
			<tr>
				<td align="left"><a href="${url}">${relativeFilePath}</a></td>
					${generateCoverageCell(coverageSummary, coverageSummaryCompare, "statements")}
					${generateCoverageCell(coverageSummary, coverageSummaryCompare, "branches")}
					${generateCoverageCell(coverageSummary, coverageSummaryCompare, "functions")}
					${generateCoverageCell(coverageSummary, coverageSummaryCompare, "lines")}
				<td align="left">${createRangeURLs(uncoveredLines, url)}</td>
			</tr>`;
}

function generateCoverageCell(
	summary: CoverageReport,
	summaryCompare: CoverageReport | undefined,
	field: keyof CoverageReport,
): string {
	let diffText = "";
	if (summaryCompare) {
		const diff = summary[field].pct - summaryCompare[field].pct;
		diffText = `<br/>${getCompareString(diff)}`;
	}
	return `<td align="right">${summary[field].pct}%${diffText}</td>`;
}

function formatGroupLine(caption: string): string {
	return `
				<tr>
					<td align="left" colspan="6"><b>${caption}</b></td>
				</tr>
	`;
}

function createRangeURLs(uncoveredLines: LineRange[], url: string): string {
	return uncoveredLines
		.map((range) => {
			let linkText = `${range.start}`;
			let urlHash = `#L${range.start}`;

			if (range.start !== range.end) {
				linkText += `-${range.end}`;
				urlHash += `-L${range.end}`;
			}

			return `<a href="${url}${urlHash}" class="text-red">${linkText}</a>`;
		})
		.join(", ");
}

function splitFilesByChangeStatus(
	filePaths: string[],
	pullChanges: string[],
): [string[], string[]] {
	return filePaths.reduce(
		([changedFiles, unchangedFiles], filePath) => {
			// Pull Changes has filePaths relative to the git repository, whereas the jsonSummary has filePaths relative to the workspace.
			// So we have to convert the filePaths to be relative to the workspace.
			const comparePath = path.relative(workspacePath, filePath);
			if (pullChanges.includes(comparePath)) {
				changedFiles.push(filePath);
			} else {
				unchangedFiles.push(filePath);
			}
			return [changedFiles, unchangedFiles];
		},
		[[], []] as [string[], string[]],
	);
}

export { generateFileCoverageHtml };
