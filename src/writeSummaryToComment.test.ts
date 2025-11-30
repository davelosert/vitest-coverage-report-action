import * as core from "@actions/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Octokit } from "./octokit";
import { writeSummaryToCommit } from "./writeSummaryToComment";

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

describe("writeSummaryToCommit()", () => {
	let mockOctokit: Octokit;
	let mockSummary: typeof core.summary;

	beforeEach(() => {
		vi.clearAllMocks();
		mockOctokit = {
			rest: {
				repos: {
					createCommitComment: vi.fn(),
				},
			},
		} as unknown as Octokit;

		mockSummary = {
			stringify: vi.fn().mockReturnValue("summary content"),
		} as unknown as typeof core.summary;
	});

	it("skips comment creation if commitSha is not provided", async () => {
		await writeSummaryToCommit({
			octokit: mockOctokit,
			summary: mockSummary,
			commitSha: "",
		});
		expect(core.info).toHaveBeenCalledWith(
			"No commit SHA found. Skipping comment creation.",
		);
		expect(mockOctokit.rest.repos.createCommitComment).not.toHaveBeenCalled();
	});

	it("creates a new comment on the commit", async () => {
		await writeSummaryToCommit({
			octokit: mockOctokit,
			summary: mockSummary,
			commitSha: "abc123",
		});

		expect(mockOctokit.rest.repos.createCommitComment).toHaveBeenCalledWith({
			owner: "owner",
			repo: "repo",
			commit_sha: "abc123",
			body: "summary content",
		});
	});
});
