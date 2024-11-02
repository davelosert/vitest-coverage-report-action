import { RequestError } from "@octokit/request-error";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";
import type { Octokit } from "../octokit";
import { FileCoverageMode } from "./FileCoverageMode";
import { getPullChanges } from "./getPullChanges";

// Avoid logs
vi.mock("@actions/core");

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

	it("handles RequestError with status 404 gracefully", async () => {
		mockOctokit.paginate.iterator = vi
			.fn()
			// biome-ignore lint/correctness/useYield: Mock implementation for testing purposes
			.mockImplementation(async function* () {
				throw new RequestError("Not Found", 404, {
					request: { headers: {}, method: "GET", url: "" },
				});
			});

		const result = await getPullChanges({
			fileCoverageMode: FileCoverageMode.Changes,
			prNumber: 123,
			octokit: mockOctokit,
		});

		expect(result).toEqual([]);
	});

	it("handles RequestError with status 403 gracefully", async () => {
		mockOctokit.paginate.iterator = vi
			.fn()
			// biome-ignore lint/correctness/useYield: Mock implementation for testing purposes
			.mockImplementation(async function* () {
				throw new RequestError("Forbidden", 403, {
					request: { headers: {}, method: "GET", url: "" },
				});
			});

		const result = await getPullChanges({
			fileCoverageMode: FileCoverageMode.Changes,
			prNumber: 123,
			octokit: mockOctokit,
		});

		expect(result).toEqual([]);
	});

	it("throws an error for other exceptions", async () => {
		mockOctokit.paginate.iterator = vi
			.fn()
			// biome-ignore lint/correctness/useYield: Mock implementation for testing error handling
			.mockImplementation(async function* () {
				throw new Error("Unexpected error");
			});
		await expect(
			getPullChanges({
				fileCoverageMode: FileCoverageMode.Changes,
				prNumber: 123,
				octokit: mockOctokit,
			}),
		).rejects.toThrow("Unexpected error");
	});
});
