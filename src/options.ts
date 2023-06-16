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
	const viteConfigPath = await getViteConfigPath(workingDirectory, core.getInput("vite-config-path"));

	const thresholds = await parseCoverageThresholds(viteConfigPath);

	const jsonFinalPath = path.resolve(workingDirectory, core.getInput('json-final-path'));
	const name = core.getInput('name');
	
	return {
		fileCoverageMode,
		jsonFinalPath,
		jsonSummaryPath,
		name,
		thresholds,
		workingDirectory
	}
}

export {
	readOptions
}