import { oneLine } from "common-tags";
import { icons } from "../icons";
import type { CoverageReport, ReportNumbers } from "../types/JsonSummary";
import type { ThresholdAlert } from "../types/ThresholdAlert";
import type { Thresholds } from "../types/Threshold";
import { getCompareString } from "./getCompareString";

function generateSummaryTableHtml(
	jsonReport: CoverageReport,
	thresholds: Thresholds = {},
	jsonCompareReport: CoverageReport | undefined = undefined,
	thresholdAlert: ThresholdAlert | undefined = undefined,
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
					${generateTableRow({ reportNumbers: jsonReport.lines, category: "Lines", threshold: thresholds.lines, reportCompareNumbers: jsonCompareReport?.lines, thresholdAlert })}
				</tr>
				<tr>
					${generateTableRow({ reportNumbers: jsonReport.statements, category: "Statements", threshold: thresholds.statements, reportCompareNumbers: jsonCompareReport?.statements, thresholdAlert })}
				</tr>
				<tr>
					${generateTableRow({ reportNumbers: jsonReport.functions, category: "Functions", threshold: thresholds.functions, reportCompareNumbers: jsonCompareReport?.functions, thresholdAlert })}
				</tr>
				<tr>
					${generateTableRow({ reportNumbers: jsonReport.branches, category: "Branches", threshold: thresholds.branches, reportCompareNumbers: jsonCompareReport?.branches, thresholdAlert })}
				</tr>
			</tbody>
		</table>
	`;
}

/**
 * Gets the appropriate status icon based on coverage percentage and threshold alert config.
 * Returns the icon for the highest threshold not exceeding the coverage percentage.
 */
function getStatusFromThresholdAlert(
	pct: number,
	thresholdAlert: ThresholdAlert,
): string {
	const thresholds = Object.keys(thresholdAlert)
		.map(Number)
		.sort((a, b) => b - a); // Sort descending

	for (const threshold of thresholds) {
		if (pct >= threshold) {
			return thresholdAlert[threshold];
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
	thresholdAlert,
}: {
	reportNumbers: ReportNumbers;
	category: string;
	threshold?: number;
	reportCompareNumbers?: ReportNumbers;
	thresholdAlert?: ThresholdAlert;
}): string {
	let status = icons.blue;
	let percent = `${reportNumbers.pct}%`;

	if (threshold) {
		// When vitest threshold is defined, use it for status determination
		percent = `${percent} (${icons.target} ${threshold}%)`;
		status = reportNumbers.pct >= threshold ? icons.green : icons.red;
	} else if (thresholdAlert) {
		// When no vitest threshold but thresholdAlert is provided, use it for status icon
		status = getStatusFromThresholdAlert(reportNumbers.pct, thresholdAlert);
	}

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
