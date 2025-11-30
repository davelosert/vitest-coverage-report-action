import * as core from "@actions/core";
import { describe, expect, it, vi } from "vitest";
import { FileCoverageMode, getCoverageModeFrom } from "./FileCoverageMode";

vi.mock("@actions/core", async (importOriginal) => ({
	...importOriginal,
	warning: vi.fn(),
}));

describe("FileCoverageMode", () => {
	it('parses "all" to the right value', () => {
		expect(getCoverageModeFrom("all")).toBe(FileCoverageMode.All);
	});

	it('parses "changes" to the right value', () => {
		expect(getCoverageModeFrom("changes")).toBe(FileCoverageMode.Changes);
	});

	it('parses "changes-affected" to the right value', () => {
		expect(getCoverageModeFrom("changes-affected")).toBe(
			FileCoverageMode.ChangesAffected,
		);
	});

	it('parses "none" to the right value', () => {
		expect(getCoverageModeFrom("none")).toBe(FileCoverageMode.None);
	});

	it('defaults to "changes" if the input is not valid', () => {
		expect(getCoverageModeFrom("invalid")).toBe(FileCoverageMode.Changes);
	});

	it("logs a warning if the input is not valid", () => {
		const spy = vi.spyOn(core, "warning");
		getCoverageModeFrom("invalid");
		expect(spy).toHaveBeenCalledWith(
			'Not valid value "invalid" for summary mode, used "changes"',
		);
		spy.mockRestore();
	});
});
