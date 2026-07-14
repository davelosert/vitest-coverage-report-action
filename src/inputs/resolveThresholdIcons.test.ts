import { describe, expect, it } from "vitest";
import { defaultThresholdIcons, icons } from "../icons";
import type { Thresholds } from "../types/Threshold";
import type { ThresholdIcons } from "../types/ThresholdIcons";
import { resolveThresholdIcons } from "./resolveThresholdIcons";

describe("resolveThresholdIcons()", () => {
	it("resolves every category to the blue default when nothing is configured", () => {
		const resolved = resolveThresholdIcons({}, undefined);

		expect(resolved.lines).toEqual(defaultThresholdIcons);
		expect(resolved.statements).toEqual(defaultThresholdIcons);
		expect(resolved.functions).toEqual(defaultThresholdIcons);
		expect(resolved.branches).toEqual(defaultThresholdIcons);
	});

	it("resolves a category with a vitest threshold to red-below/green-at-or-above that threshold", () => {
		const thresholds: Thresholds = { lines: 80 };

		const resolved = resolveThresholdIcons(thresholds, undefined);

		expect(resolved.lines).toEqual({ 0: icons.red, 80: icons.green });
	});

	it("resolves each category independently based on its own vitest threshold", () => {
		const thresholds: Thresholds = {
			lines: 80,
			statements: 70,
		};

		const resolved = resolveThresholdIcons(thresholds, undefined);

		expect(resolved.lines).toEqual({ 0: icons.red, 80: icons.green });
		expect(resolved.statements).toEqual({ 0: icons.red, 70: icons.green });
		expect(resolved.functions).toEqual(defaultThresholdIcons);
		expect(resolved.branches).toEqual(defaultThresholdIcons);
	});

	it("uses the explicit threshold-icons for every category when provided, ignoring vitest thresholds", () => {
		const thresholds: Thresholds = { lines: 80, branches: 90 };
		const explicitThresholdIcons: ThresholdIcons = {
			0: "❌",
			50: "⚠️",
			90: "✅",
		};

		const resolved = resolveThresholdIcons(thresholds, explicitThresholdIcons);

		expect(resolved.lines).toBe(explicitThresholdIcons);
		expect(resolved.statements).toBe(explicitThresholdIcons);
		expect(resolved.functions).toBe(explicitThresholdIcons);
		expect(resolved.branches).toBe(explicitThresholdIcons);
	});
});
