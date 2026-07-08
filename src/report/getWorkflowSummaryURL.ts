import * as github from "@actions/github";

function getWorkflowSummaryURL() {
	const { owner, repo } = github.context.repo;
	const { runId } = github.context;
	return `${github.context.serverUrl}/${owner}/${repo}/actions/runs/${runId}`;
}

export { getWorkflowSummaryURL };
