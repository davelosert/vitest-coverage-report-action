import { oneLine } from "common-tags";
import { icons } from "../icons";
import type { CoverageReport, ReportNumbers } from "../types/JsonSummary";
import type { Thresholds } from "../types/Threshold";
import { getCompareString } from "./getCompareString";

function generateSummaryTableHtml(
	jsonReport: CoverageReport,
	thresholds: Thresholds = {},
	jsonCompareReport: CoverageReport | undefined = undefined,
	comparisonDecimalPlaces = 2,
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
					${generateTableRow({ reportNumbers: jsonReport.lines, category: "Lines", threshold: thresholds.lines, reportCompareNumbers: jsonCompareReport?.lines, comparisonDecimalPlaces })}
				</tr>
				<tr>
					${generateTableRow({ reportNumbers: jsonReport.statements, category: "Statements", threshold: thresholds.statements, reportCompareNumbers: jsonCompareReport?.statements, comparisonDecimalPlaces })}
				</tr>
				<tr>
					${generateTableRow({ reportNumbers: jsonReport.functions, category: "Functions", threshold: thresholds.functions, reportCompareNumbers: jsonCompareReport?.functions, comparisonDecimalPlaces })}
				</tr>
				<tr>
					${generateTableRow({ reportNumbers: jsonReport.branches, category: "Branches", threshold: thresholds.branches, reportCompareNumbers: jsonCompareReport?.branches, comparisonDecimalPlaces })}
				</tr>
			</tbody>
		</table>
	`;
}

function generateTableRow({
	reportNumbers,
	category,
	threshold,
	reportCompareNumbers,
	comparisonDecimalPlaces = 2,
}: {
	reportNumbers: ReportNumbers;
	category: string;
	threshold?: number;
	reportCompareNumbers?: ReportNumbers;
	comparisonDecimalPlaces?: number;
}): string {
	let status = icons.blue;
	let percent = `${reportNumbers.pct}%`;

	if (threshold) {
		percent = `${percent} (${icons.target} ${threshold}%)`;
		status = reportNumbers.pct >= threshold ? icons.green : icons.red;
	}

	if (reportCompareNumbers) {
		const percentDiff = reportNumbers.pct - reportCompareNumbers.pct;
		const compareString = getCompareString(
			percentDiff,
			comparisonDecimalPlaces,
		);
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
