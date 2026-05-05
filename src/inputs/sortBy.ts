import * as core from "@actions/core";

type SortMetric = "statements" | "branches" | "functions" | "lines";
type SortDirection = "asc" | "desc";

type SortBy =
	| { metric: "name" }
	| { metric: SortMetric; direction: SortDirection };

const VALID_METRICS: SortMetric[] = [
	"statements",
	"branches",
	"functions",
	"lines",
];
const VALID_DIRECTIONS: SortDirection[] = ["asc", "desc"];

function getSortByFrom(input: string): SortBy {
	if (!input || input === "name") {
		return { metric: "name" };
	}

	const lastDash = input.lastIndexOf("-");
	if (lastDash === -1) {
		core.warning(`Not a valid value "${input}" for sort-by, using "name".`);
		return { metric: "name" };
	}

	const metric = input.slice(0, lastDash);
	const direction = input.slice(lastDash + 1);

	if (
		!VALID_METRICS.includes(metric as SortMetric) ||
		!VALID_DIRECTIONS.includes(direction as SortDirection)
	) {
		core.warning(`Not a valid value "${input}" for sort-by, using "name".`);
		return { metric: "name" };
	}

	return {
		metric: metric as SortMetric,
		direction: direction as SortDirection,
	};
}

export type { SortBy, SortDirection, SortMetric };
export { getSortByFrom };
