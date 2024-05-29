import * as core from '@actions/core';
import { getCoverageModeFrom } from './FileCoverageMode';
import * as path from 'node:path';
import { getViteConfigPath } from './getViteConfigPath';
import { parseCoverageThresholds } from './parseCoverageThresholds';

async function readOptions() {
	// Working directory can be used to modify all default/provided paths (for monorepos, etc)
	const workingDirectory = core.getInput('working-directory');

	const fileCoverageModeRaw = core.getInput('file-coverage-mode'); // all/changes/none
	const fileCoverageMode = getCoverageModeFrom(fileCoverageModeRaw);

	const jsonSummaryPath = path.resolve(workingDirectory, core.getInput('json-summary-path'));
	const jsonFinalPath = path.resolve(workingDirectory, core.getInput('json-final-path'));


	const jsonSummaryCompareInput = core.getInput('json-summary-compare-path');
	let jsonSummaryComparePath;
	if (jsonSummaryCompareInput) {
		jsonSummaryComparePath = path.resolve(workingDirectory, jsonSummaryCompareInput);
	}

	const name = core.getInput('name');
	const prNumber = core.getInput('pr-number');

	// ViteConfig is optional, as it is only required for thresholds. If no vite config is provided, we will not include thresholds in the final report.
	const viteConfigPath = await getViteConfigPath(workingDirectory, core.getInput("vite-config-path"));
	const thresholds = viteConfigPath ? await parseCoverageThresholds(viteConfigPath) : {};

	return {
		fileCoverageMode,
		jsonFinalPath,
		jsonSummaryPath,
		jsonSummaryComparePath,
		name,
		thresholds,
		workingDirectory,
		prNumber,
	}
}

export {
	readOptions
}
