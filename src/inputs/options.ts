import * as core from '@actions/core';
import { getCoverageModeFrom } from './FileCoverageMode';
import * as path from 'node:path';
import { getViteConfigPath } from './getViteConfigPath';
import { parseCoverageThresholds } from './parseCoverageThresholds';
import { parseViteConfigReporters } from "./parseViteConfigReporters";


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

	// Get the user-defined pull-request number and perform input validation
	const prNumber = core.getInput('pr-number');
	let processedPrNumber: number | undefined = Number(prNumber);
	if (!Number.isSafeInteger(processedPrNumber) || processedPrNumber <= 0) {
		processedPrNumber = undefined;
	}
	if (processedPrNumber) {
		core.info(`Received pull-request number: ${processedPrNumber}`);
	}

	// ViteConfig is optional, as it is only required for thresholds. If no vite config is provided, we will not include thresholds in the final report.
	const viteConfigPath = await getViteConfigPath(workingDirectory, core.getInput("vite-config-path"));
	const thresholds = viteConfigPath ? await parseCoverageThresholds(viteConfigPath) : {};
	const providers = viteConfigPath ? await parseViteConfigReporters(viteConfigPath) : [];

	return {
		fileCoverageMode,
		jsonFinalPath,
		jsonSummaryPath,
		jsonSummaryComparePath,
		name,
		thresholds,
		workingDirectory,
		processedPrNumber,
	}
}

export {
	readOptions
}
