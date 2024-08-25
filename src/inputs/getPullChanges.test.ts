import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { FileCoverageMode } from "./FileCoverageMode";
import { getPullChanges } from "./getPullChanges";
import type { Octokit } from "../octokit";

const mockGetInput = vi.hoisted(() => vi.fn());
vi.mock("@actions/core", () => ({
	getInput: mockGetInput,
	endGroup: vi.fn(),
	startGroup: vi.fn(),
	info: vi.fn(),
	debug: vi.fn(),
}));

const mockContext = vi.hoisted(() => ({
	repo: {
		owner: "owner",
		repo: "repo",
	},
	payload: {},
}));
vi.mock("@actions/github", () => ({
	context: mockContext,
}));

describe("getPullChanges()", () => {
	let mockOctokit: Octokit;
	beforeEach(() => {
		vi.clearAllMocks();
		mockOctokit = {
			paginate: {
				iterator: vi.fn().mockReturnValue([
					{
						data: [
							{ status: "added", filename: "file1.ts" },
							{ status: "modified", filename: "file2.ts" },
						],
					},
				]),
			},
			rest: {
				pulls: {
					listFiles: vi.fn(),
				},
			},
		} as unknown as Octokit;
	});

	it("returns an empty array if fileCoverageMode is None", async () => {
		const result = await getPullChanges({
			fileCoverageMode: FileCoverageMode.None,
			octokit: mockOctokit,
		});
		expect(result).toEqual([]);
	});

	it("returns an empty array if prNumber is not provided", async () => {
		mockContext.payload = {};
		const result = await getPullChanges({
			fileCoverageMode: FileCoverageMode.All,
			octokit: mockOctokit,
		});
		expect(result).toEqual([]);
	});

	it("fetches and returns the changed files when prNumber is provided", async () => {
		mockContext.payload = {};
		const result = await getPullChanges({
			fileCoverageMode: FileCoverageMode.Changes,
			prNumber: 123,
			octokit: mockOctokit,
		});
		expect(result).toEqual(["file1.ts", "file2.ts"]);
	});
});
