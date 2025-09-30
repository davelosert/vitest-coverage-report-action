import * as path from "node:path";
import * as core from "@actions/core";
import type { Octokit } from "../octokit";
import type { Thresholds } from "../types/Threshold";
import { type FileCoverageMode, getCoverageModeFrom } from "./FileCoverageMode";
import { type CommentOn, getCommentOn } from "./getCommentOn";
import { getCommitSHA } from "./getCommitSHA";
import { getPullRequestNumber } from "./getPullRequestNumber";
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
	commentOn: Array<CommentOn>;
	fileCoverageRootPath: string;
	comparisonDecimalPlaces: number;
	showAllFileComparisons: boolean;
	showAffectedFiles: boolean;
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

	const commentOn = getCommentOn();

	// ViteConfig is optional, as it is only required for thresholds. If no vite config is provided, we will not include thresholds in the final report.
	const viteConfigPath = await getViteConfigPath(
		workingDirectory,
		core.getInput("vite-config-path"),
	);

	const thresholds = viteConfigPath
		? await parseCoverageThresholds(viteConfigPath)
		: {};

	const commitSHA = getCommitSHA();

	let prNumber: number | undefined = undefined;
	if (commentOn.includes("pr")) {
		// Get the user-defined pull-request number and perform input validation
		prNumber = await getPullRequestNumber(octokit);
	}

	const fileCoverageRootPath = core.getInput("file-coverage-root-path");

	const comparisonDecimalPlacesInput = core.getInput(
		"comparison-decimal-places",
	);
	const comparisonDecimalPlaces = comparisonDecimalPlacesInput
		? Number.parseInt(comparisonDecimalPlacesInput, 10)
		: 2;

	const showAllFileComparisonsInput = core.getInput(
		"show-all-file-comparisons",
	);
	const showAllFileComparisons = showAllFileComparisonsInput === "true";

	const showAffectedFilesInput = core.getInput("show-affected-files");
	const showAffectedFiles = showAffectedFilesInput === "true";

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
		commentOn,
		fileCoverageRootPath,
		comparisonDecimalPlaces,
		showAllFileComparisons,
		showAffectedFiles,
	};
}

export { readOptions };

export type { Options };
