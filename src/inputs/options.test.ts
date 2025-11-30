import * as core from "@actions/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasThresholds, parseComparisonDecimalPlaces } from "./options";

vi.mock("@actions/core");

describe("hasThresholds()", () => {
	it("returns false when all thresholds are undefined", () => {
		expect(hasThresholds({})).toBe(false);
	});

	it("returns true when lines threshold is defined", () => {
		expect(hasThresholds({ lines: 80 })).toBe(true);
	});

	it("returns true when branches threshold is defined", () => {
		expect(hasThresholds({ branches: 80 })).toBe(true);
	});

	it("returns true when functions threshold is defined", () => {
		expect(hasThresholds({ functions: 80 })).toBe(true);
	});

	it("returns true when statements threshold is defined", () => {
		expect(hasThresholds({ statements: 80 })).toBe(true);
	});

	it("returns true when multiple thresholds are defined", () => {
		expect(
			hasThresholds({
				lines: 80,
				branches: 70,
				functions: 90,
				statements: 85,
			}),
		).toBe(true);
	});

	it("returns true when at least one threshold is defined among undefined ones", () => {
		expect(
			hasThresholds({
				lines: undefined,
				branches: 80,
				functions: undefined,
				statements: undefined,
			}),
		).toBe(true);
	});
});

describe("parseComparisonDecimalPlaces()", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns default value of 2 for empty input", () => {
		expect(parseComparisonDecimalPlaces("")).toBe(2);
		expect(core.warning).not.toHaveBeenCalled();
	});

	it("parses valid positive integers correctly", () => {
		expect(parseComparisonDecimalPlaces("4")).toBe(4);
		expect(parseComparisonDecimalPlaces("0")).toBe(0);
		expect(parseComparisonDecimalPlaces("10")).toBe(10);
		expect(core.warning).not.toHaveBeenCalled();
	});

	it("returns default and warns for invalid string input", () => {
		expect(parseComparisonDecimalPlaces("abc")).toBe(2);
		expect(core.warning).toHaveBeenCalledWith(
			'Invalid value "abc" for comparison-decimal-places. Using default value of 2.',
		);
	});

	it("returns default and warns for negative numbers", () => {
		expect(parseComparisonDecimalPlaces("-1")).toBe(2);
		expect(core.warning).toHaveBeenCalledWith(
			'Invalid value "-1" for comparison-decimal-places. Using default value of 2.',
		);
	});

	it("returns default and warns for floating point numbers", () => {
		// parseInt will parse "2.5" as 2, which is valid
		expect(parseComparisonDecimalPlaces("2.5")).toBe(2);
		expect(core.warning).not.toHaveBeenCalled();
	});

	it("returns default and warns for special values", () => {
		expect(parseComparisonDecimalPlaces("NaN")).toBe(2);
		expect(core.warning).toHaveBeenCalledWith(
			'Invalid value "NaN" for comparison-decimal-places. Using default value of 2.',
		);
	});
});
