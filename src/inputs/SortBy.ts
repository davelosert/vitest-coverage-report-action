import * as core from "@actions/core";

enum SortBy {
	Name = "name",
	CoverageAsc = "coverage-asc",
	CoverageDesc = "coverage-desc",
}

function getSortByFrom(input: string): SortBy {
	if (!input) {
		return SortBy.Name;
	}
	const allEnums = Object.values(SortBy) as string[];
	if (!allEnums.includes(input)) {
		core.warning(`Not valid value "${input}" for sort-by, used "name"`);
		return SortBy.Name;
	}
	return input as SortBy;
}

export { getSortByFrom, SortBy };
