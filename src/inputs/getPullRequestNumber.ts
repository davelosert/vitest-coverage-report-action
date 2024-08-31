import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "../octokit";

async function getPullRequestNumber(
	octokit: Octokit,
): Promise<number | undefined> {
	// Get the user-defined pull-request number and perform input validation
	const prNumberFromInput = core.getInput("pr-number");
	const processedPrNumber: number | undefined = Number(prNumberFromInput);

	// Check if it is a full integer. Check for non-null as qhen the option is not set, the parsed input will be an empty string
	// which becomes 0 when parsed to a number.
	if (Number.isSafeInteger(processedPrNumber) && processedPrNumber !== 0) {
		core.info(`Received pull-request number: ${processedPrNumber}`);
		return processedPrNumber;
	}

	if (github.context.payload.pull_request) {
		core.info(
			`Found pull-request number in the action's "payload.pull_request" context: ${github.context.payload.pull_request.number}`,
		);
		return github.context.payload.pull_request.number;
	}

	if (github.context.eventName === "workflow_run") {
		// Workflow_runs triggered from non-forked PRs will have the PR number in the payload
		if (github.context.payload.workflow_run.pull_requests.length > 0) {
			core.debug(
				`Found pull-request number in the action's "payload.workflow_run" context: ${github.context.payload.workflow_run.pull_requests[0].number}`,
			);
			return github.context.payload.workflow_run.pull_requests[0].number;
		}

		// ... in all other cases, we have to call the API to get a matching PR number
		core.debug(
			"Trying to find pull-request number in payload.workflow_run context by calling the API",
		);
		return await findPullRequestBySHA(
			octokit,
			github.context.payload.workflow_run.head_sha,
		);
	}

	core.info("No pull-request number found. Comment creation will be skipped!");
	return undefined;
}

async function findPullRequestBySHA(
	octokit: Octokit,
	headSha: string,
): Promise<number | undefined> {
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
				return pullRequest.number;
			}
		}
	}
	core.endGroup();
	core.info(`Could not find the pull-request for commit "${headSha}".`);
	return undefined;
}

export { getPullRequestNumber };
