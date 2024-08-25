import * as path from "node:path";
import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "../octokit";
import type { Thresholds } from "../types/Threshold";
import { type FileCoverageMode, getCoverageModeFrom } from "./FileCoverageMode";
import { getPullRequestNumberFromTriggeringWorkflow } from "./getPullRequestNumber";
import { getViteConfigPath } from "./getViteConfigPath";
import { parseCoverageThresholds } from "./parseCoverageThresholds";

type Options = {
	fileCoverageMode: FileCoverageMode;
	jsonFinalPath: string;
	jsonSummaryPath: string;
	jsonSummaryComparePath: string | null;
	name: string;
	thresholds: Thresholds;
	workingDirectory: string;
	prNumber: number | undefined;
	commitSHA: string;
};

async function readOptions(octokit: Octokit): Promise<Options> {
	// Working directory can be used to modify all default/provided paths (for monorepos, etc)
	const workingDirectory = core.getInput("working-directory");

	const fileCoverageModeRaw = core.getInput("file-coverage-mode"); // all/changes/none
	const fileCoverageMode = getCoverageModeFrom(fileCoverageModeRaw);

	const jsonSummaryPath = path.resolve(
		workingDirectory,
		core.getInput("json-summary-path"),
	);

	const jsonFinalPath = path.resolve(
		workingDirectory,
		core.getInput("json-final-path"),
	);

	const jsonSummaryCompareInput = core.getInput("json-summary-compare-path");
	let jsonSummaryComparePath: string | null = null;
	if (jsonSummaryCompareInput) {
		jsonSummaryComparePath = path.resolve(
			workingDirectory,
			jsonSummaryCompareInput,
		);
	}

	const name = core.getInput("name");

	// ViteConfig is optional, as it is only required for thresholds. If no vite config is provided, we will not include thresholds in the final report.
	const viteConfigPath = await getViteConfigPath(
		workingDirectory,
		core.getInput("vite-config-path"),
	);

	const thresholds = viteConfigPath
		? await parseCoverageThresholds(viteConfigPath)
		: {};

	// Get the user-defined pull-request number and perform input validation
	const prNumber = await getPrNumber(octokit);
	const commitSHA = getCommitSHA();

	return {
		fileCoverageMode,
		jsonFinalPath,
		jsonSummaryPath,
		jsonSummaryComparePath,
		name,
		thresholds,
		workingDirectory,
		prNumber,
		commitSHA,
	};
}

async function getPrNumber(octokit: Octokit): Promise<number | undefined> {
	// Get the user-defined pull-request number and perform input validation
	const prNumberFromInput = core.getInput("pr-number");
	const processedPrNumber: number | undefined = Number(prNumberFromInput);

	// Check if it is a full integer. Check for non-null as qhen the option is not set, the parsed input will be an empty string 
	// which becomes 0 when parsed to a number.
	if (Number.isSafeInteger(processedPrNumber) && processedPrNumber !== 0) {
		core.debug(`Received pull-request number: ${processedPrNumber}`);
		return processedPrNumber;
	}

	if (github.context.payload.pull_request) {
		core.debug(
			`Found pull-request number in payload.pull_request context: ${github.context.payload.pull_request.number}`,
		);
		return github.context.payload.pull_request.number;
	}

	if (github.context.eventName === "workflow_run") {
		// Workflow_runs triggered from non-forked PRs will have the PR number in the payload
		if (github.context.payload.workflow_run.pull_requests.length > 0) {
			core.debug(
				`Found pull-request number in payload.workflow_run context: ${github.context.payload.workflow_run.pull_requests[0].number}`,
			);
			return github.context.payload.workflow_run.pull_requests[0].number;
		}

		// ... in all other cases, we have to call the API to get a matching PR number
		core.debug(
			"Trying to find pull-request number in payload.workflow_run context by calling the API",
		);
		return await getPullRequestNumberFromTriggeringWorkflow(octokit);
	}

	core.debug("No pull-request number found.");
	return undefined;
}

function getCommitSHA(): string {
	if (
		github.context.eventName === "pull_request" ||
		github.context.eventName === "pull_request_target" ||
		github.context.eventName === "push"
	) {
		return github.context.sha;
	}

	if (github.context.eventName === "workflow_run") {
		return github.context.payload.workflow_run.head_commit.id;
	}

	return github.context.sha;
}

export { readOptions };
