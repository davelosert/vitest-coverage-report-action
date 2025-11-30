import { oneLine } from "common-tags";
import { defaultThresholdIcons, icons } from "../icons";
import type { CoverageReport, ReportNumbers } from "../types/JsonSummary";
import type { Thresholds } from "../types/Threshold";
import type { ThresholdIcons } from "../types/ThresholdIcons";
import { getCompareString } from "./getCompareString";

function generateSummaryTableHtml(
	jsonReport: CoverageReport,
	thresholds: Thresholds = {},
	jsonCompareReport: CoverageReport | undefined = undefined,
	thresholdIcons: ThresholdIcons = defaultThresholdIcons,
): string {
	return oneLine`
		<table>
			<thead>
				<tr>
				 <th align="center">Status</th>
				 <th align="left">Category</th>
				 <th align="right">Percentage</th>
				 <th align="right">Covered / Total</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					${generateTableRow({ reportNumbers: jsonReport.lines, category: "Lines", threshold: thresholds.lines, reportCompareNumbers: jsonCompareReport?.lines, thresholdIcons })}
				</tr>
				<tr>
					${generateTableRow({ reportNumbers: jsonReport.statements, category: "Statements", threshold: thresholds.statements, reportCompareNumbers: jsonCompareReport?.statements, thresholdIcons })}
				</tr>
				<tr>
					${generateTableRow({ reportNumbers: jsonReport.functions, category: "Functions", threshold: thresholds.functions, reportCompareNumbers: jsonCompareReport?.functions, thresholdIcons })}
				</tr>
				<tr>
					${generateTableRow({ reportNumbers: jsonReport.branches, category: "Branches", threshold: thresholds.branches, reportCompareNumbers: jsonCompareReport?.branches, thresholdIcons })}
				</tr>
			</tbody>
		</table>
	`;
}

/**
 * Gets the appropriate status icon based on coverage percentage and threshold icons config.
 * Returns the icon for the highest threshold not exceeding the coverage percentage.
 */
function getStatusFromThresholdIcons(
	pct: number,
	thresholdIcons: ThresholdIcons,
): string {
	const thresholds = Object.keys(thresholdIcons)
		.map(Number)
		.sort((a, b) => b - a); // Sort descending

	for (const threshold of thresholds) {
		if (pct >= threshold) {
			return thresholdIcons[threshold];
		}
	}

	// Fallback to blue if no threshold matches
	return icons.blue;
}

function generateTableRow({
	reportNumbers,
	category,
	threshold,
	reportCompareNumbers,
	thresholdIcons,
}: {
	reportNumbers: ReportNumbers;
	category: string;
	threshold?: number;
	reportCompareNumbers?: ReportNumbers;
	thresholdIcons: ThresholdIcons;
}): string {
	let percent = `${reportNumbers.pct}%`;

	// If vitest threshold is defined, show the target percentage
	if (threshold) {
		percent = `${percent} (${icons.target} ${threshold}%)`;
	}

	// Always use thresholdIcons for status icon
	const status = getStatusFromThresholdIcons(reportNumbers.pct, thresholdIcons);

	if (reportCompareNumbers) {
		const percentDiff = reportNumbers.pct - reportCompareNumbers.pct;
		const compareString = getCompareString(percentDiff);
		percent = `${percent}<br/>${compareString}`;
	}

	return `
    <td align="center">${status}</td>
    <td align="left">${category}</td>
		<td align="right">${percent}</td>
    <td align="right">${reportNumbers.covered} / ${reportNumbers.total}</td>
  `;
}

export { generateSummaryTableHtml };
