import { describe, expect, it, vi } from "vitest";
import { parseThresholdIcons } from "./parseThresholdIcons";

vi.mock("@actions/core", () => ({
	warning: vi.fn(),
}));

describe("parseThresholdIcons", () => {
	it("returns undefined for empty string", () => {
		expect(parseThresholdIcons("")).toBeUndefined();
		expect(parseThresholdIcons("   ")).toBeUndefined();
	});

	it("parses valid JSON with single quotes", () => {
		const input = "{0: '🔴', 80: '🟠', 90: '🟢'}";
		const result = parseThresholdIcons(input);
		expect(result).toEqual({
			0: "🔴",
			80: "🟠",
			90: "🟢",
		});
	});

	it("parses valid JSON with double quotes", () => {
		const input = '{"0": "🔴", "80": "🟠", "90": "🟢"}';
		const result = parseThresholdIcons(input);
		expect(result).toEqual({
			0: "🔴",
			80: "🟠",
			90: "🟢",
		});
	});

	it("handles single threshold", () => {
		const input = "{50: '⚠️'}";
		const result = parseThresholdIcons(input);
		expect(result).toEqual({
			50: "⚠️",
		});
	});

	it("returns undefined for invalid JSON", () => {
		const input = "not valid json";
		const result = parseThresholdIcons(input);
		expect(result).toBeUndefined();
	});

	it("returns undefined for non-object value", () => {
		const input = '"just a string"';
		const result = parseThresholdIcons(input);
		expect(result).toBeUndefined();
	});

	it("returns undefined for null", () => {
		const input = "null";
		const result = parseThresholdIcons(input);
		expect(result).toBeUndefined();
	});

	it("skips non-numeric keys but parses valid ones", () => {
		const input = "{0: '🔴', invalid: '🟠', 90: '🟢'}";
		const result = parseThresholdIcons(input);
		expect(result).toEqual({
			0: "🔴",
			90: "🟢",
		});
	});

	it("skips non-string values but parses valid ones", () => {
		const input = "{0: '🔴', 80: 123, 90: '🟢'}";
		const result = parseThresholdIcons(input);
		expect(result).toEqual({
			0: "🔴",
			90: "🟢",
		});
	});

	it("returns undefined when no valid entries remain after filtering", () => {
		const input = "{invalid: '🔴', bad: 123}";
		const result = parseThresholdIcons(input);
		expect(result).toBeUndefined();
	});
});
