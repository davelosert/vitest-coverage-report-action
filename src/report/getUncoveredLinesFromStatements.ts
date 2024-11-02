import type { StatementCoverageReport } from "../types/JsonFinal";

type LineRange = {
	start: number;
	end: number;
};

const IS_COVERED = 1;

const getUncoveredLinesFromStatements = ({
	s,
	statementMap,
}: StatementCoverageReport): LineRange[] => {
	const keys = Object.keys(statementMap);

	const uncoveredLineRanges: LineRange[] = [];
	let currentRange: LineRange | undefined = undefined;
	for (const key of keys) {
		if (s[key] === IS_COVERED) {
			// If the statement is covered, we need to close the current range.
			if (currentRange) {
				uncoveredLineRanges.push(currentRange);
				currentRange = undefined;
			}
			// Besides that, we can just ignore covered lines
			continue;
		}

		// Start a new range if we don't have one yet.
		if (!currentRange) {
			currentRange = {
				start: statementMap[key].start.line,
				end: statementMap[key].end.line,
			};
			continue;
		}

		currentRange.end = statementMap[key].end.line;
	}

	// If we still have a current range, we need to add it to the uncovered line ranges.
	if (currentRange) {
		uncoveredLineRanges.push(currentRange);
	}

	return uncoveredLineRanges;
};

export { getUncoveredLinesFromStatements };

export type { LineRange };
