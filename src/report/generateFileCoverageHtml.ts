import * as path from "node:path";
import { oneLine } from "common-tags";
import { FileCoverageMode } from "../inputs/FileCoverageMode";
import type { JsonFinal } from "../types/JsonFinal";
import type { CoverageReport, JsonSummary } from "../types/JsonSummary";
import { generateBlobFileUrl } from "./generateFileUrl";
import { getCompareString } from "./getCompareString";
import {
	getUncoveredLinesFromStatements,
	type LineRange,
} from "./getUncoveredLinesFromStatements";

type FileCoverageInputs = {
	jsonSummary: JsonSummary;
	jsonSummaryCompare: JsonSummary | undefined;
	jsonFinal: JsonFinal;
	fileCoverageMode: FileCoverageMode;
	pullChanges: string[];
	commitSHA: string;
	workspacePath: string;
	comparisonDecimalPlaces?: number;
	showAllFileComparisons?: boolean;
	showAffectedFiles?: boolean;
};

const generateFileCoverageHtml = ({
	jsonSummary,
	jsonSummaryCompare,
	jsonFinal,
	fileCoverageMode,
	pullChanges,
	commitSHA,
	workspacePath,
	comparisonDecimalPlaces = 2,
	showAllFileComparisons = false,
	showAffectedFiles = false,
}: FileCoverageInputs) => {
	const filePaths = Object.keys(jsonSummary).filter((key) => key !== "total");

	let reportData = "";

	const [changedFiles, unchangedFiles] = splitFilesByChangeStatus(
		filePaths,
		pullChanges,
		workspacePath,
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
								workspacePath,
								comparisonDecimalPlaces,
							),
						)
						.join("")}
				`;
	}

	if (fileCoverageMode === FileCoverageMode.All && unchangedFiles.length > 0) {
		// Split unchanged files into affected and unaffected if comparison data is available and feature is enabled
		if (showAffectedFiles && jsonSummaryCompare) {
			const [affectedFiles, unaffectedFiles] = splitFilesByCoverageChange(
				unchangedFiles,
				jsonSummary,
				jsonSummaryCompare,
			);

			// Show affected files group
			if (affectedFiles.length > 0) {
				reportData += `
						${formatGroupLine("Affected Files")}
						${affectedFiles
							.map((filePath) =>
								generateRow(
									filePath,
									jsonSummary,
									jsonSummaryCompare,
									jsonFinal,
									commitSHA,
									workspacePath,
									comparisonDecimalPlaces,
								),
							)
							.join("")}
					`;
			}

			// Show unaffected files group (with or without comparisons based on showAllFileComparisons)
			if (unaffectedFiles.length > 0) {
				const unaffectedFilesCompare = showAllFileComparisons
					? jsonSummaryCompare
					: undefined;

				reportData += `
						${formatGroupLine("Unaffected Files")}
						${unaffectedFiles
							.map((filePath) =>
								generateRow(
									filePath,
									jsonSummary,
									unaffectedFilesCompare,
									jsonFinal,
									commitSHA,
									workspacePath,
									comparisonDecimalPlaces,
								),
							)
							.join("")}
					`;
			}
		} else {
			// Original behavior: show all unchanged files
			const unchangedFilesCompare = showAllFileComparisons
				? jsonSummaryCompare
				: undefined;

			reportData += `
						${formatGroupLine("Unchanged Files")}
						${unchangedFiles
							.map((filePath) =>
								generateRow(
									filePath,
									jsonSummary,
									unchangedFilesCompare,
									jsonFinal,
									commitSHA,
									workspacePath,
									comparisonDecimalPlaces,
								),
							)
							.join("")}
				`;
		}
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
	workspacePath: string,
	comparisonDecimalPlaces = 2,
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
					${generateCoverageCell(coverageSummary, coverageSummaryCompare, "statements", comparisonDecimalPlaces)}
					${generateCoverageCell(coverageSummary, coverageSummaryCompare, "branches", comparisonDecimalPlaces)}
					${generateCoverageCell(coverageSummary, coverageSummaryCompare, "functions", comparisonDecimalPlaces)}
					${generateCoverageCell(coverageSummary, coverageSummaryCompare, "lines", comparisonDecimalPlaces)}
				<td align="left">${createRangeURLs(uncoveredLines, url)}</td>
			</tr>`;
}

function generateCoverageCell(
	summary: CoverageReport,
	summaryCompare: CoverageReport | undefined,
	field: keyof CoverageReport,
	comparisonDecimalPlaces = 2,
): string {
	let diffText = "";
	if (summaryCompare) {
		const diff = summary[field].pct - summaryCompare[field].pct;
		diffText = `<br/>${getCompareString(diff, comparisonDecimalPlaces)}`;
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
	workspacePath: string,
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

function splitFilesByCoverageChange(
	filePaths: string[],
	jsonSummary: JsonSummary,
	jsonSummaryCompare: JsonSummary,
): [string[], string[]] {
	return filePaths.reduce(
		([affectedFiles, unaffectedFiles], filePath) => {
			const currentCoverage = jsonSummary[filePath];
			const previousCoverage = jsonSummaryCompare[filePath];

			// If file doesn't exist in comparison, consider it unaffected
			if (!previousCoverage) {
				unaffectedFiles.push(filePath);
				return [affectedFiles, unaffectedFiles];
			}

			// Check if any coverage metric has changed
			// Using strict equality is acceptable here because:
			// 1. These percentages come from the same source (vitest coverage reports)
			// 2. The comparison is only for categorization, not for display
			// 3. Any actual change will be reflected in the comparison display
			const hasChanged =
				currentCoverage.statements.pct !== previousCoverage.statements.pct ||
				currentCoverage.branches.pct !== previousCoverage.branches.pct ||
				currentCoverage.functions.pct !== previousCoverage.functions.pct ||
				currentCoverage.lines.pct !== previousCoverage.lines.pct;

			if (hasChanged) {
				affectedFiles.push(filePath);
			} else {
				unaffectedFiles.push(filePath);
			}

			return [affectedFiles, unaffectedFiles];
		},
		[[], []] as [string[], string[]],
	);
}

export { generateFileCoverageHtml };
