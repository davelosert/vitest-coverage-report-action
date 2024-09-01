import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "./octokit";

const writeSummaryToCommit = async ({
	octokit,
	summary,
	commitSha,
}: {
	octokit: Octokit;
	summary: typeof core.summary;
	commitSha: string;
}) => {
	if (!commitSha) {
		core.info("No commit SHA found. Skipping comment creation.");
		return;
	}

	const commentBody = summary.stringify();

	await octokit.rest.repos.createCommitComment({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		commit_sha: commitSha,
		body: commentBody,
	});
};

export { writeSummaryToCommit };
