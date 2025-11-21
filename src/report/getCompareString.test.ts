import { describe, expect, it } from "vitest";
import { icons } from "../icons";
import { getCompareString } from "./getCompareString";

describe("getCompareString()", () => {
	it("returns equal string when diff is 0", () => {
		const result = getCompareString(0);
		expect(result).toBe(`${icons.equal} <em>±0%</em>`);
	});

	it("returns increase string with positive diff and 2 decimal places by default", () => {
		const result = getCompareString(5.123456);
		expect(result).toBe(`${icons.increase} <em>+5.12%</em>`);
	});

	it("returns decrease string with negative diff and 2 decimal places by default", () => {
		const result = getCompareString(-3.987654);
		expect(result).toBe(`${icons.decrease} <em>-3.99%</em>`);
	});

	it("returns increase string with custom decimal places", () => {
		const result = getCompareString(5.123456, 4);
		expect(result).toBe(`${icons.increase} <em>+5.1235%</em>`);
	});

	it("returns decrease string with custom decimal places", () => {
		const result = getCompareString(-3.987654, 3);
		expect(result).toBe(`${icons.decrease} <em>-3.988%</em>`);
	});

	it("returns increase string with 0 decimal places", () => {
		const result = getCompareString(5.7, 0);
		expect(result).toBe(`${icons.increase} <em>+6%</em>`);
	});

	it("returns decrease string with 0 decimal places", () => {
		const result = getCompareString(-3.4, 0);
		expect(result).toBe(`${icons.decrease} <em>-3%</em>`);
	});

	it("handles very small differences with higher precision", () => {
		const result = getCompareString(0.001234, 5);
		expect(result).toBe(`${icons.increase} <em>+0.00123%</em>`);
	});
});
