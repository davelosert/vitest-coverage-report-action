import { FileCoverageMode } from './inputs/FileCoverageMode.js'
import { generateFileCoverageHtml } from './report/generateFileCoverageHtml.js';
import { generateHeadline } from './report/generateHeadline.js';
import { generateSummaryTableHtml } from './report/generateSummaryTableHtml.js';
import { getPullChanges } from './inputs/getPullChanges.js';
import { parseVitestJsonFinal, parseVitestJsonSummary } from './inputs/parseJsonReports.js';
import { readOptions } from './inputs/options.js';
import { RequestError } from '@octokit/request-error'
import { writeSummaryToPR } from './writeSummaryToPR.js';
import * as core from '@actions/core';
import * as github from '@actions/github';

const run = async () => {
	const {
		fileCoverageMode,
		jsonFinalPath,
		jsonSummaryPath,
		jsonSummaryComparePath,
		name,
		thresholds,
		workingDirectory,
		prNumber
	} = await readOptions();

	const jsonSummary = await parseVitestJsonSummary(jsonSummaryPath);

	let jsonSummaryCompare;
	if (jsonSummaryComparePath) {
		jsonSummaryCompare = await parseVitestJsonSummary(jsonSummaryComparePath);
	}

	const tableData = generateSummaryTableHtml(jsonSummary.total, thresholds, jsonSummaryCompare?.total);
	const summary = core.summary
		.addHeading(generateHeadline({ workingDirectory, name }), 2)
		.addRaw(tableData)

	if (fileCoverageMode !== FileCoverageMode.None) {
		const pullChanges = await getPullChanges(fileCoverageMode);
		const jsonFinal = await parseVitestJsonFinal(jsonFinalPath);
		const fileTable = generateFileCoverageHtml({
			jsonSummary, jsonFinal, fileCoverageMode, pullChanges
		});
		summary.addDetails('File Coverage', fileTable)
	}

	summary
		.addRaw(`<em>Generated in workflow <a href=${getWorkflowSummaryURL()}>#${github.context.runNumber}</a></em>`)

	let processedPrNumber: number | undefined = Number(prNumber);
	core.info(`Received pull-request number: ${prNumber}`);

	if (!Number.isSafeInteger(processedPrNumber) || processedPrNumber <= 0) {
		processedPrNumber = undefined;
	}

	try {
		await writeSummaryToPR({
			summary,
			markerPostfix: getMarkerPostfix({ name, workingDirectory }),
			userDefinedPrNumber: processedPrNumber
		});
	} catch (error) {
		if (error instanceof RequestError && (error.status === 404 || error.status === 403)) {
			core.warning(
				`Couldn't write a comment to the pull-request. Please make sure your job has the permission 'pull-request: write'.
				 Original Error was: [${error.name}] - ${error.message}
				`
			)

		} else {
			// Rethrow to handle it in the catch block of the run()-call.
			throw error;
		}
	}

	await summary.write();
};

function getMarkerPostfix({ name, workingDirectory }: { name: string, workingDirectory: string }) {
	if (name) return name;
	if (workingDirectory !== './') return workingDirectory;
	return 'root'
}

function getWorkflowSummaryURL() {
	const { owner, repo } = github.context.repo;
	const { runId } = github.context;
	return `${github.context.serverUrl}/${owner}/${repo}/actions/runs/${runId}`
}


run().then(() => {
	core.info('Report generated successfully.');
}).catch((err) => {
	core.error(err);
});
