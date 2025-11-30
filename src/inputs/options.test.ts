import { describe, expect, it } from "vitest";
import { hasThresholds } from "./options";

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
