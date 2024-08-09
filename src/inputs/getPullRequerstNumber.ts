import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "../octokit";

async function getPullRequestNumberFromTriggeringWorkflow(
	octokit: Octokit,
): Promise<number | undefined> {
	core.info(
		"Trying to get the triggering workflow in order to find the pull-request-number to comment the results on...",
	);

	if (!github.context.payload.workflow_run) {
		core.info(
			"The triggering workflow does not have a workflow_run payload. Skipping comment creation.",
		);
		return undefined;
	}

	const originalWorkflowRunId = github.context.payload.workflow_run.id;

	const { data: originalWorkflowRun } =
		await octokit.rest.actions.getWorkflowRun({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			run_id: originalWorkflowRunId,
		});

	if (originalWorkflowRun.event !== "pull_request") {
		core.info(
			"The triggering workflow is not a pull-request. Skipping comment creation.",
		);
		return undefined;
	}

	// When the actual pull-request is not coming from a fork, the pull_request object is correctly populated and we can shortcut here
	if (
		originalWorkflowRun.pull_requests &&
		originalWorkflowRun.pull_requests.length > 0
	) {
		return originalWorkflowRun.pull_requests[0].number;
	}

	// When the actual pull-request is coming from a fork, the pull_request object is not populated (see https://github.com/orgs/community/discussions/25220)
	core.info(
		`Trying to find the pull-request for the triggering workflow run with id: ${originalWorkflowRunId} (${originalWorkflowRun.url}) with HEAD_SHA ${originalWorkflowRun.head_sha}...`,
	);

	// The way to find the pull-request in this scenario is to query all existing pull_requests on the target repository and find the one with the same HEAD_SHA as the original workflow run
	const pullRequest = await findPullRequest(
		octokit,
		originalWorkflowRun.head_sha,
	);

	if (!pullRequest) {
		core.info(
			"Could not find the pull-request for the triggering workflow run. Skipping comment creation.",
		);
		return undefined;
	}

	return pullRequest.number;
}

async function findPullRequest(octokit: Octokit, headSha: string) {
	core.startGroup("Querying REST API for pull-requests.");
	const pullRequestsIterator = octokit.paginate.iterator(
		octokit.rest.pulls.list,
		{
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			per_page: 30,
		},
	);

	for await (const { data: pullRequests } of pullRequestsIterator) {
		core.info(`Found ${pullRequests.length} pull-requests in this page.`);
		for (const pullRequest of pullRequests) {
			core.debug(
				`Comparing: ${pullRequest.number} sha: ${pullRequest.head.sha} with expected: ${headSha}.`,
			);
			if (pullRequest.head.sha === headSha) {
				return pullRequest;
			}
		}
	}
	core.endGroup();
	return undefined;
}

export {
	getPullRequestNumberFromTriggeringWorkflow,
};
