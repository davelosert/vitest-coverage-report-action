import * as path from "node:path";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { type FileCoverageMode, getCoverageModeFrom } from "./FileCoverageMode";
import { getViteConfigPath } from "./getViteConfigPath";
import { parseCoverageThresholds } from "./parseCoverageThresholds";
import type { Thresholds } from "../types/Threshold";
import type { Octokit } from "../octokit";
import { getPullRequestNumberFromTriggeringWorkflow } from "./getPullRequerstNumber";

type Options = {
	fileCoverageMode: FileCoverageMode;
	jsonFinalPath: string;
	jsonSummaryPath: string;
	jsonSummaryComparePath: string | null;
	name: string;
	thresholds: Thresholds;
	workingDirectory: string;
	prNumber: number | undefined;
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

	// Get the user-defined pull-request number and perform input validation
	const prNumber = await getPrNumber(octokit);

	// ViteConfig is optional, as it is only required for thresholds. If no vite config is provided, we will not include thresholds in the final report.
	const viteConfigPath = await getViteConfigPath(
		workingDirectory,
		core.getInput("vite-config-path"),
	);

	const thresholds = viteConfigPath
		? await parseCoverageThresholds(viteConfigPath)
		: {};

	return {
		fileCoverageMode,
		jsonFinalPath,
		jsonSummaryPath,
		jsonSummaryComparePath,
		name,
		thresholds,
		workingDirectory,
		prNumber,
	};
}

async function getPrNumber(octokit: Octokit) {
	// Get the user-defined pull-request number and perform input validation
	const prNumberFromInput = core.getInput("pr-number");
	const processedPrNumber: number | undefined = Number(prNumberFromInput);

	// The user defined Number will always take precedence
	if (Number.isSafeInteger(processedPrNumber) && processedPrNumber <= 0) {
		return prNumberFromInput;
	}

	if (processedPrNumber) {
		core.info(`Received pull-request number: ${processedPrNumber}`);
	}

	if(github.context.payload.pull_request) {
		return github.context.payload.pull_request.number;
	}

	if(github.context.eventName === "workflow_run") {
		// Workflow_runs triggered from non-forked PRs will have the PR number in the payload
		if(github.context.payload.workflow_run.pull_requests.length > 0) {
			return github.context.payload.workflow_run.pull_requests[0].number;
		}

		// ... in all other cases, we have to call the API to get a matching PR number
		return await getPullRequestNumberFromTriggeringWorkflow(octokit);
	}
}

export { readOptions };
