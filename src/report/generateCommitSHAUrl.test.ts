import { describe, expect, it, vi } from "vitest";
import { generateCommitSHAUrl } from "./generateCommitSHAUrl";

const mockContext = vi.hoisted(() => ({
	repo: {
		owner: "owner",
		repo: "repo",
	},
	serverUrl: "https://github.com",
	payload: {},
}));
vi.mock("@actions/github", () => ({
	context: mockContext,
}));

describe("generateCommitSHAUrl", () => {
	it("should generate the correct commit SHA URL", () => {
		const commitSHA = "abcdef123456";
		const expectedUrl = "https://github.com/owner/repo/commit/abcdef123456";

		const url = generateCommitSHAUrl(commitSHA);

		expect(url).toBe(expectedUrl);
	});
});
