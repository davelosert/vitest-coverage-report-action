import * as core from "@actions/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Octokit } from "./octokit";
import { writeSummaryToPR } from "./writeSummaryToPR";

vi.mock("@actions/core");

const mockContext = vi.hoisted(() => ({
	repo: {
		owner: "owner",
		repo: "repo",
	},
	payload: {},
	serverUrl: "https://github.com",
	runId: 42,
}));
vi.mock("@actions/github", () => ({
	context: mockContext,
}));

describe("writeSummaryToPR()", () => {
	let mockOctokit: Octokit;
	let mockSummary: typeof core.summary;

	beforeEach(() => {
		vi.clearAllMocks();
		mockOctokit = {
			paginate: {
				iterator: vi.fn().mockReturnValue([
					{
						data: [
							{
								id: 1,
								body: "existing comment <!-- vitest-coverage-report-marker-root -->",
							},
						],
					},
				]),
			},
			rest: {
				issues: {
					listComments: vi.fn(),
					updateComment: vi.fn(),
					createComment: vi.fn(),
				},
				pulls: {
					get: vi.fn().mockResolvedValue({ data: { body: "" } }),
					update: vi.fn(),
				},
			},
		} as unknown as Octokit;

		mockSummary = {
			stringify: vi.fn().mockReturnValue("summary content"),
		} as unknown as typeof core.summary;
	});

	it("skips comment creation if prNumber is not provided", async () => {
		await writeSummaryToPR({
			octokit: mockOctokit,
			summary: mockSummary,
		});
		expect(core.info).toHaveBeenCalledWith(
			"No pull-request-number found. Skipping comment creation.",
		);
		expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
		expect(mockOctokit.rest.issues.updateComment).not.toHaveBeenCalled();
	});

	it("updates an existing comment if found", async () => {
		await writeSummaryToPR({
			octokit: mockOctokit,
			summary: mockSummary,
			prNumber: 123,
		});
		expect(mockOctokit.rest.issues.updateComment).toHaveBeenCalledWith({
			owner: "owner",
			repo: "repo",
			comment_id: 1,
			body: "summary content\n\n<!-- vitest-coverage-report-marker-root -->",
		});
		expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
	});

	it("creates a new comment if no existing comment is found", async () => {
		mockOctokit.paginate.iterator = vi.fn().mockReturnValue([
			{
				data: [],
			},
		]);

		await writeSummaryToPR({
			octokit: mockOctokit,
			summary: mockSummary,
			prNumber: 123,
		});

		expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
			owner: "owner",
			repo: "repo",
			issue_number: 123,
			body: "summary content\n\n<!-- vitest-coverage-report-marker-root -->",
		});
		expect(mockOctokit.rest.issues.updateComment).not.toHaveBeenCalled();
	});

	it("injects into the PR body between markers and posts no comment", async () => {
		mockOctokit.rest.pulls.get = vi.fn().mockResolvedValue({
			data: {
				body: "## Intro\ntext\n<!-- vitest-coverage-report-marker-start-root -->\nold\n<!-- vitest-coverage-report-marker-end-root -->\n## Outro",
			},
		});

		await writeSummaryToPR({
			octokit: mockOctokit,
			summary: mockSummary,
			prNumber: 123,
		});

		expect(mockOctokit.rest.pulls.update).toHaveBeenCalledWith({
			owner: "owner",
			repo: "repo",
			pull_number: 123,
			body: "## Intro\ntext\n<!-- vitest-coverage-report-marker-start-root -->\nsummary content\n<!-- vitest-coverage-report-marker-end-root -->\n## Outro",
		});
		expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
		expect(mockOctokit.rest.issues.updateComment).not.toHaveBeenCalled();
	});

	it("warns and falls back to a comment when only one marker is present", async () => {
		mockOctokit.rest.pulls.get = vi.fn().mockResolvedValue({
			data: {
				body: "text\n<!-- vitest-coverage-report-marker-start-root -->\nno end marker",
			},
		});

		await writeSummaryToPR({
			octokit: mockOctokit,
			summary: mockSummary,
			prNumber: 123,
		});

		expect(core.warning).toHaveBeenCalled();
		expect(mockOctokit.rest.pulls.update).not.toHaveBeenCalled();
		expect(mockOctokit.rest.issues.updateComment).toHaveBeenCalled();
	});

	it("warns and falls back to a comment when the end marker comes first", async () => {
		mockOctokit.rest.pulls.get = vi.fn().mockResolvedValue({
			data: {
				body: "text\n<!-- vitest-coverage-report-marker-end-root -->\nreversed\n<!-- vitest-coverage-report-marker-start-root -->",
			},
		});

		await writeSummaryToPR({
			octokit: mockOctokit,
			summary: mockSummary,
			prNumber: 123,
		});

		expect(core.warning).toHaveBeenCalled();
		expect(mockOctokit.rest.pulls.update).not.toHaveBeenCalled();
		expect(mockOctokit.rest.issues.updateComment).toHaveBeenCalled();
	});

	it("replaces an oversized report with a stub linking to the workflow summary", async () => {
		mockSummary.stringify = vi.fn().mockReturnValue("x".repeat(70000));
		mockOctokit.paginate.iterator = vi.fn().mockReturnValue([{ data: [] }]);

		await writeSummaryToPR({
			octokit: mockOctokit,
			summary: mockSummary,
			prNumber: 123,
		});

		const body = (
			mockOctokit.rest.issues.createComment as ReturnType<typeof vi.fn>
		).mock.calls[0][0].body;
		expect(body).toContain("too large to inline");
		expect(body).toContain("https://github.com/owner/repo/actions/runs/42");
		expect(body).toContain("<!-- vitest-coverage-report-marker-root -->");
		expect(body.length).toBeLessThanOrEqual(65536);
	});
});
