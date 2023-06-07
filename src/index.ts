import { generateSummaryTableHtml } from './generateSummaryTableHtml.js';
import path from 'node:path';
import { parseVitestJsonFinal, parseVitestJsonSummary } from './parseJsonReports.js';
import { writeSummaryToPR } from './writeSummaryToPR.js';
import * as core from '@actions/core';
import { RequestError } from '@octokit/request-error'
import { parseCoverageThresholds } from './parseCoverageThresholds.js';
import { generateFileCoverageHtml } from './generateFileCoverageHtml.js';
import { getViteConfigPath } from './getViteConfigPath.js';
import { getPullChanges } from './getPullChanges.js';
import { FileCoverageMode, getCoverageModeFrom } from './FileCoverageMode.js'

const run = async () => {
	const {
		workingDirectory,
		fileCoverageMode,
		jsonSummaryPath,
		jsonFinalPath,
		thresholds
	} = await readOptions();

	const jsonSummary = await parseVitestJsonSummary(jsonSummaryPath);

	let summaryHeading = "Coverage Summary";
	if (workingDirectory !== './') {
		summaryHeading += ` for \`${workingDirectory}\``;
	}

	const tableData = generateSummaryTableHtml(jsonSummary.total, thresholds);
	const summary = core.summary
		.addHeading(summaryHeading, 2)
		.addRaw(tableData)

	if (fileCoverageMode !== FileCoverageMode.None) {
		const pullChanges = await getPullChanges(fileCoverageMode);
		const jsonFinal = await parseVitestJsonFinal(jsonFinalPath);
		const fileTable = generateFileCoverageHtml({
			jsonSummary, jsonFinal, fileCoverageMode, pullChanges
		});
		summary.addDetails('File Coverage', fileTable)
	}

	try {
		await writeSummaryToPR(summary);
	} catch (error) {
		if (error instanceof RequestError && (error.status === 404 || error.status === 403)) {
			core.warning(
				`Couldn't write a comment to the pull-request. Please make sure your job has the permission 'pull-request: write'.`
			)
		} else {
			// Rethrow to handle it in the catch block of the run()-call.
			throw error;
		}
	}

	await summary.write();
};

run().then(() => {
	core.info('Report generated successfully.');
}).catch((err) => {
	core.error(err);
});

async function readOptions() {
	// Working directory can be used to modify all default/provided paths (for monorepos, etc)
	const workingDirectory = core.getInput('working-directory');

	const fileCoverageModeRaw = core.getInput('file-coverage-mode'); // all/changes/none
	const fileCoverageMode = getCoverageModeFrom(fileCoverageModeRaw);

	const jsonSummaryPath = path.resolve(workingDirectory, core.getInput('json-summary-path'));
	const viteConfigPath = await getViteConfigPath(workingDirectory, core.getInput("vite-config-path"));

	const thresholds = await parseCoverageThresholds(viteConfigPath);

	const jsonFinalPath = path.resolve(workingDirectory, core.getInput('json-final-path'));
	
	return {
		workingDirectory,
		fileCoverageMode,
		jsonSummaryPath,
		thresholds,
		jsonFinalPath
	}
}