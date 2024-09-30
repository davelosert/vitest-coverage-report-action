import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "../octokit";

async function getPullRequestNumber(
	octokit: Octokit,
): Promise<number | undefined> {
	// Get the user-defined pull-request number and perform input validation
	const prNumberFromInput = core.getInput("pr-number");

	if (prNumberFromInput === "none") {
		core.info("prNumber set to 'none'. Comment creation will be skipped!");
		return undefined;
	}

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

	if (github.context.eventName === "push" && prNumberFromInput === "auto") {
		const sha = github.context.payload.head_commit.id;
		core.info(
			`Trying to find a pull-request with a head commit matching the SHA found in the action's "payload.head_commit.id" context (${sha}) from the GitHub API.`,
		);

		let prNumber = await fetchPRsByListingPRsForCommit(octokit, sha);
		if (!prNumber) {
			core.info(
				"Couldn't find PR using the /commits/:commit_sha/pulls endpoint. Trying by listing all PRs for current repository...",
			);
			prNumber = await fetchPRsByListingAllPRs(octokit, sha);
		}

		return prNumber;
	}

	if (github.context.eventName === "workflow_run") {
		// Workflow_runs triggered from non-forked PRs will have the PR number in the payload
		if (github.context.payload.workflow_run.pull_requests.length > 0) {
			core.info(
				`Found pull-request number in the action's "payload.workflow_run" context: ${github.context.payload.workflow_run.pull_requests[0].number}`,
			);
			return github.context.payload.workflow_run.pull_requests[0].number;
		}

		const sha = github.context.payload.workflow_run.head_sha;
		// ... in all other cases, we have to call the API to get a matching PR number
		core.info(
			`Trying to find a pull-request with a head commit matchin the SHA found in the action's "payload.workflow_run.head_sha" context (${sha}) from the GitHub API.`,
		);
		return await fetchPRsByListingAllPRs(
			octokit,
			github.context.payload.workflow_run.head_sha,
		);
	}

	core.info("No pull-request number found. Comment creation will be skipped!");
	return undefined;
}

async function fetchPRsByListingAllPRs(
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
			sort: "updated",
			direction: "desc",
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
	core.info(`Could not find a pull-request for commit "${headSha}".`);
	return undefined;
}

async function fetchPRsByListingPRsForCommit(
	octokit: Octokit,
	headSha: string,
): Promise<number | undefined> {
	core.info(
		"Trying to find pull-request using the /commits/:commit_sha/pulls endpoint...",
	);
	const { data: pullRequests } =
		await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			commit_sha: headSha,
		});

	if (pullRequests.length > 0) {
		core.info(
			`Found ${pullRequests.length} pull-requests associated with commit "${headSha}".`,
		);
		return pullRequests[0].number;
	}

	return undefined;
}

export { getPullRequestNumber };
