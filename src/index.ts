import { generateSummaryTableHtml } from './generateSummaryTableHtml.js';
import { parseVitestJsonFinal, parseVitestJsonSummary } from './parseJsonReports.js';
import { writeSummaryToPR } from './writeSummaryToPR.js';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { RequestError } from '@octokit/request-error'
import { generateFileCoverageHtml } from './generateFileCoverageHtml.js';
import { getPullChanges } from './getPullChanges.js';
import { FileCoverageMode } from './FileCoverageMode.js'
import { readOptions } from './options.js';
import { generateHeadline } from './generateHeadline.js';

const run = async () => {
	const {
		fileCoverageMode,
		jsonFinalPath,
		jsonSummaryPath,
		name,
		thresholds,
		workingDirectory
	} = await readOptions();


	const jsonSummary = await parseVitestJsonSummary(jsonSummaryPath);
	const tableData = generateSummaryTableHtml(jsonSummary.total, thresholds);
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
		.addRaw(`<em>Generated in workflow <a href=${getWorkflowSummaryURL()}>${github.context.runNumber}</a></em>`)

	try {
		await writeSummaryToPR({
			summary,
			markerPostfix: getMarkerPostfix({ name, workingDirectory })
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