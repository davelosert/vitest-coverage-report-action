import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as core from "@actions/core";
import { getCommentOn, type CommentOn } from "./getCommentOn";

vi.mock("@actions/core");

describe("getCommentOn()", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns the default value ['pr'] if no valid values are provided", () => {
		vi.spyOn(core, "getInput").mockReturnValue("invalid1, invalid2");

		const result = getCommentOn();
		expect(result).toEqual(["pr"]);
		expect(core.warning).toHaveBeenCalledWith(
			'No valid options for comment-on found. Falling back to default value "pr".',
		);
	});

	it("logs invalid values", () => {
		vi.spyOn(core, "getInput").mockReturnValue("pr, invalid, commit");

		const result = getCommentOn();
		expect(result).toEqual(["pr", "commit"]);
		expect(core.warning).toHaveBeenCalledWith(
			'Invalid options for comment-on: invalid. Valid options are "pr" and "commit".',
		);
	});

	it("returns valid values correctly", () => {
		vi.spyOn(core, "getInput").mockReturnValue("pr, commit");

		const result = getCommentOn();
		expect(result).toEqual(["pr", "commit"]);
		expect(core.warning).not.toHaveBeenCalled();
	});

	it("trims whitespace from the input", () => {
		vi.spyOn(core, "getInput").mockReturnValue("pr, commit");

		const result = getCommentOn();

		expect(result).toEqual(["pr", "commit"]);

		expect(core.warning).not.toHaveBeenCalled();
	});

	it("returns valid values and logs invalid values", () => {
		vi.spyOn(core, "getInput").mockReturnValue(
			"pr, invalid, commit, anotherInvalid",
		);

		const result = getCommentOn();
		expect(result).toEqual(["pr", "commit"]);
		expect(core.warning).toHaveBeenCalledWith(
			'Invalid options for comment-on: invalid, anotherInvalid. Valid options are "pr" and "commit".',
		);
	});

	it("for value 'none', returns empty array", () => {
		vi.spyOn(core, "getInput").mockReturnValue("none");

		const result = getCommentOn();

		expect(result).toEqual([]);
	});
});
