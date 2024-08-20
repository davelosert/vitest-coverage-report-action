import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileCoverageMode } from "./FileCoverageMode";
import { getPullChanges } from "./getPullChanges";

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
const mockGetOctokit = vi.hoisted(() => vi.fn());
vi.mock("@actions/github", () => ({
	context: mockContext,
	getOctokit: mockGetOctokit,
}));

describe("getPullChanges", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetInput.mockReturnValue("fake-token");
		const mockOctokit = {
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
		};
		mockGetOctokit.mockReturnValue(mockOctokit);
	});

	it("should return an empty array if fileCoverageMode is None", async () => {
		const result = await getPullChanges({
			fileCoverageMode: FileCoverageMode.None,
		});
		expect(result).toEqual([]);
	});

	it("should return an empty array if prNumber is not provided and context payload has no pull request number", async () => {
		mockContext.payload = {};
		const result = await getPullChanges({
			fileCoverageMode: FileCoverageMode.All,
		});
		expect(result).toEqual([]);
	});

	it("should fetch and return changed files when prNumber is provided but not in the context", async () => {
		mockContext.payload = {};
		const result = await getPullChanges({
			fileCoverageMode: FileCoverageMode.All,
			prNumber: 123,
		});
		expect(result).toEqual(["file1.ts", "file2.ts"]);
	});

	it("should fetch and return changed files when prNumber is in the context but not provided", async () => {
		mockContext.payload = { pull_request: { number: 123 } };
		const result = await getPullChanges({
			fileCoverageMode: FileCoverageMode.All,
		});
		expect(result).toEqual(["file1.ts", "file2.ts"]);
	});
});
