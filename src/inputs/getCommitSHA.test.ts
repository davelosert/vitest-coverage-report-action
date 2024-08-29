import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getCommitSHA } from "./getCommitSHA";

const mockContext = vi.hoisted(() => ({
	repo: {
		owner: "owner",
		repo: "repo",
	},
	payload: {},
	eventName: "",
	sha: "defaultsha",
}));
vi.mock("@actions/github", () => ({
	context: mockContext,
}));

describe("getCommitSHA()", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockContext.payload = {};
		mockContext.eventName = "";
		mockContext.sha = "defaultsha";
	});

	afterEach(() => {
		mockContext.payload = {};
		mockContext.eventName = "";
		mockContext.sha = "defaultsha";
		vi.unstubAllEnvs();
	});

	it("if in pull-request context, returns the head sha", () => {
		mockContext.eventName = "pull_request";
		mockContext.payload = {
			pull_request: {
				head: {
					sha: "prsha",
				},
			},
		};

		const result = getCommitSHA();
		expect(result).toBe("prsha");
	});

	it("if in pull_request_target context, returns the head sha", () => {
		mockContext.eventName = "pull_request_target";
		mockContext.payload = {
			pull_request: {
				head: {
					sha: "prsha",
				},
			},
		};

		const result = getCommitSHA();
		expect(result).toBe("prsha");
	});

	it("if in workflow_run context, returns the SHA from workflow_run context if found", () => {
		mockContext.eventName = "workflow_run";
		mockContext.payload = {
			workflow_run: {
				head_commit: {
					id: "workflowsha",
				},
			},
		};

		const result = getCommitSHA();
		expect(result).toBe("workflowsha");
	});

	it("returns the default SHA for other events", () => {
		mockContext.eventName = "push";
		mockContext.sha = "pushsha";

		const result = getCommitSHA();
		expect(result).toBe("pushsha");
	});
});
