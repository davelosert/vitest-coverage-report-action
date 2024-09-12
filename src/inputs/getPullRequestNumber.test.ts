import type * as core from "@actions/core";
import {
	type Mock,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import type { Octokit } from "../octokit";
import { getPullRequestNumber } from "./getPullRequestNumber";

type Core = typeof core;

// Avoid logs
vi.mock("@actions/core", async (importOriginal): Promise<Core> => {
	const original: Core = await importOriginal();
	return {
		...original,
		startGroup: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
		debug: vi.fn(),
	};
});

const mockContext = vi.hoisted(() => ({
	repo: {
		owner: "owner",
		repo: "repo",
	},
	payload: {},
	eventName: "",
}));
vi.mock("@actions/github", () => ({
	context: mockContext,
}));

describe("getPullRequestNumber()", () => {
	let mockOctokit: Octokit;
	beforeEach(() => {
		vi.clearAllMocks();
		mockOctokit = {
			paginate: {
				iterator: vi.fn(),
			},
			rest: {
				pulls: {
					list: vi.fn(),
				},
			},
		} as unknown as Octokit;
	});

	afterEach(() => {
		mockContext.payload = {};
		mockContext.eventName = "";
		vi.unstubAllEnvs();
	});

	it("returns the PR number from the input 'pr-number' if valid ", async () => {
		vi.stubEnv("INPUT_PR-NUMBER", "123");

		const result = await getPullRequestNumber(mockOctokit);
		expect(result).toBe(123);
	});

	it("in context of pull-request, returns the PR number from the payload.pull_request.", async () => {
		mockContext.payload = {
			pull_request: {
				number: 456,
			},
		};

		const result = await getPullRequestNumber(mockOctokit);
		expect(result).toBe(456);
	});

	it("in context of a workflow_run, returns the PR number from payload.workflow_run if found", async () => {
		mockContext.eventName = "workflow_run";
		mockContext.payload = {
			workflow_run: {
				pull_requests: [{ number: 789 }],
				head_sha: "testsha",
			},
		};

		const result = await getPullRequestNumber(mockOctokit);
		expect(result).toBe(789);
	});

	it("in context of a workflow_run from a fork, calls the API to find PR number by the head_sha of the payload.workflow_run when called from a fork", async () => {
		mockContext.eventName = "workflow_run";
		mockContext.payload = {
			workflow_run: {
				pull_requests: [],
				head_sha: "testsha",
			},
		};

		(mockOctokit.paginate.iterator as Mock).mockReturnValue([
			{
				data: [{ number: 101, head: { sha: "testsha" } }],
			},
		]);

		const result = await getPullRequestNumber(mockOctokit);
		expect(result).toBe(101);
	});

	it("in context of a push event, calls the API to find PR number by the head_sha of the payload.", async () => {
		mockContext.eventName = "push";
		mockContext.payload = {
			head_commit: {
				id: "testsha"
			},
		};

		(mockOctokit.paginate.iterator as Mock).mockReturnValue([
			{
				data: [{ number: 101, head: { sha: "testsha" } }],
			},
		]);

		const result = await getPullRequestNumber(mockOctokit);
		expect(result).toBe(101);
	});

	it("returns undefined if no pr number is found", async () => {
		mockContext.payload = {};
		const result = await getPullRequestNumber(mockOctokit);
		expect(result).toBeUndefined();
	});
});
