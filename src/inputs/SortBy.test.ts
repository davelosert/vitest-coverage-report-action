import * as core from "@actions/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSortByFrom, SortBy } from "./SortBy";

vi.mock("@actions/core");

describe("getSortByFrom()", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns SortBy.Name for empty input", () => {
		expect(getSortByFrom("")).toBe(SortBy.Name);
		expect(core.warning).not.toHaveBeenCalled();
	});

	it("returns SortBy.Name for 'name'", () => {
		expect(getSortByFrom("name")).toBe(SortBy.Name);
	});

	it("returns SortBy.CoverageAsc for 'coverage-asc'", () => {
		expect(getSortByFrom("coverage-asc")).toBe(SortBy.CoverageAsc);
	});

	it("returns SortBy.CoverageDesc for 'coverage-desc'", () => {
		expect(getSortByFrom("coverage-desc")).toBe(SortBy.CoverageDesc);
	});

	it("warns and falls back to SortBy.Name for invalid values", () => {
		expect(getSortByFrom("lines-asc")).toBe(SortBy.Name);
		expect(core.warning).toHaveBeenCalledWith(
			'Not valid value "lines-asc" for sort-by, used "name"',
		);
	});
});
