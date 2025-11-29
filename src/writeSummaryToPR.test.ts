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
});
