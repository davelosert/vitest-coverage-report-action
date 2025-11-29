import * as path from "node:path";
import * as core from "@actions/core";
import { defaultThresholdIcons } from "../icons";
import type { Octokit } from "../octokit";
import type { ThresholdIcons } from "../types/ThresholdIcons";
import type { Thresholds } from "../types/Threshold";
import { type FileCoverageMode, getCoverageModeFrom } from "./FileCoverageMode";
import { type CommentOn, getCommentOn } from "./getCommentOn";
import { getCommitSHA } from "./getCommitSHA";
import { getPullRequestNumber } from "./getPullRequestNumber";
import { getViteConfigPath } from "./getViteConfigPath";
import { parseCoverageThresholds } from "./parseCoverageThresholds";
import { parseThresholdIcons } from "./parseThresholdIcons";

type Options = {
	fileCoverageMode: FileCoverageMode;
	jsonFinalPath: string;
	jsonSummaryPath: string;
	jsonSummaryComparePath: string | null;
	name: string;
	thresholds: Thresholds;
	thresholdIcons: ThresholdIcons;
	workingDirectory: string;
	prNumber: number | undefined;
	commitSHA: string;
	commentOn: Array<CommentOn>;
	fileCoverageRootPath: string;
};

/**
 * Checks if any coverage thresholds are defined.
 */
function hasThresholds(thresholds: Thresholds): boolean {
	return (
		thresholds.lines !== undefined ||
		thresholds.branches !== undefined ||
		thresholds.functions !== undefined ||
		thresholds.statements !== undefined
	);
}

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

	// Parse user-provided threshold icons, returns undefined if empty/invalid (with warnings)
	const parsedThresholdIcons = parseThresholdIcons(
		core.getInput("threshold-icons"),
	);

	// Normalize threshold icons: always have a valid ThresholdIcons object
	// - If valid icons provided, use them
	// - If both coverage thresholds AND icons provided, warn about potential mismatch
	// - If no valid icons, use default (blue circles)
	let thresholdIcons: ThresholdIcons;
	if (parsedThresholdIcons) {
		thresholdIcons = parsedThresholdIcons;
		if (hasThresholds(thresholds)) {
			core.warning(
				"Both coverage thresholds and threshold-icons are defined. " +
					"The threshold-icons will be used for status display, but they may not reflect " +
					"the actual pass/fail status from the coverage thresholds.",
			);
		}
	} else {
		thresholdIcons = defaultThresholdIcons;
	}

	const commitSHA = getCommitSHA();

	let prNumber: number | undefined = undefined;
	if (commentOn.includes("pr")) {
		// Get the user-defined pull-request number and perform input validation
		prNumber = await getPullRequestNumber(octokit);
	}

	const fileCoverageRootPath = core.getInput("file-coverage-root-path");

	return {
		fileCoverageMode,
		jsonFinalPath,
		jsonSummaryPath,
		jsonSummaryComparePath,
		name,
		thresholds,
		thresholdIcons,
		workingDirectory,
		prNumber,
		commitSHA,
		commentOn,
		fileCoverageRootPath,
	};
}

export { readOptions };

export type { Options };
