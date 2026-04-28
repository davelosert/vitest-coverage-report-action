import * as core from "@actions/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSortByFrom } from "./sortBy";

vi.mock("@actions/core");

describe("getSortByFrom()", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns name metric for empty input", () => {
		expect(getSortByFrom("")).toEqual({ metric: "name" });
		expect(core.warning).not.toHaveBeenCalled();
	});

	it("returns name metric for 'name'", () => {
		expect(getSortByFrom("name")).toEqual({ metric: "name" });
		expect(core.warning).not.toHaveBeenCalled();
	});

	it.each([
		"statements",
		"branches",
		"functions",
		"lines",
	] as const)("returns correct metric and direction for '%s-asc'", (metric) => {
		expect(getSortByFrom(`${metric}-asc`)).toEqual({
			metric,
			direction: "asc",
		});
	});

	it.each([
		"statements",
		"branches",
		"functions",
		"lines",
	] as const)("returns correct metric and direction for '%s-desc'", (metric) => {
		expect(getSortByFrom(`${metric}-desc`)).toEqual({
			metric,
			direction: "desc",
		});
	});

	it("warns and falls back to name metric for an invalid metric", () => {
		expect(getSortByFrom("coverage-asc")).toEqual({ metric: "name" });
		expect(core.warning).toHaveBeenCalledWith(
			'Not a valid value "coverage-asc" for sort-by, using "name".',
		);
	});

	it("warns and falls back to name metric for an invalid direction", () => {
		expect(getSortByFrom("statements-highest")).toEqual({ metric: "name" });
		expect(core.warning).toHaveBeenCalledWith(
			'Not a valid value "statements-highest" for sort-by, using "name".',
		);
	});

	it("warns and falls back to name metric for input with no hyphen", () => {
		expect(getSortByFrom("statements")).toEqual({ metric: "name" });
		expect(core.warning).toHaveBeenCalledWith(
			'Not a valid value "statements" for sort-by, using "name".',
		);
	});
});
