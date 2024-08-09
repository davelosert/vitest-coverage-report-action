import * as core from "@actions/core";
import * as github from "@actions/github";
import { RequestError } from "@octokit/request-error";
import { FileCoverageMode } from "./inputs/FileCoverageMode.js";
import { getPullChanges } from "./inputs/getPullChanges.js";
import { readOptions } from "./inputs/options.js";
import {
	parseVitestJsonFinal,
	parseVitestJsonSummary,
} from "./inputs/parseJsonReports.js";
import { generateFileCoverageHtml } from "./report/generateFileCoverageHtml.js";
import { generateHeadline } from "./report/generateHeadline.js";
import { generateSummaryTableHtml } from "./report/generateSummaryTableHtml.js";
import type { JsonSummary } from "./types/JsonSummary.js";
import { writeSummaryToPR } from "./writeSummaryToPR.js";
import { createOctokit } from './octokit.js';

const run = async () => {
	const octokit = createOctokit();

	const {
		fileCoverageMode,
		jsonFinalPath,
		jsonSummaryPath,
		jsonSummaryComparePath,
		name,
		thresholds,
		workingDirectory,
		prNumber,
	} = await readOptions(octokit);

	const jsonSummary = await parseVitestJsonSummary(jsonSummaryPath);

	let jsonSummaryCompare: JsonSummary | undefined;
	if (jsonSummaryComparePath) {
		jsonSummaryCompare = await parseVitestJsonSummary(jsonSummaryComparePath);
	}

	const tableData = generateSummaryTableHtml(
		jsonSummary.total,
		thresholds,
		jsonSummaryCompare?.total,
	);
	const summary = core.summary
		.addHeading(generateHeadline({ workingDirectory, name }), 2)
		.addRaw(tableData);

	if (fileCoverageMode !== FileCoverageMode.None) {
		const pullChanges = await getPullChanges({
			fileCoverageMode,
			prNumber: processedPrNumber,
		});
		const jsonFinal = await parseVitestJsonFinal(jsonFinalPath);
		const fileTable = generateFileCoverageHtml({
			jsonSummary,
			jsonFinal,
			fileCoverageMode,
			pullChanges,
		});
		summary.addDetails("File Coverage", fileTable);
	}

	summary.addRaw(
		`<em>Generated in workflow <a href=${getWorkflowSummaryURL()}>#${github.context.runNumber}</a></em>`,
	);

	try {
		await writeSummaryToPR({
			octokit,
			summary,
			markerPostfix: getMarkerPostfix({ name, workingDirectory }),
			prNumber,
		});
	} catch (error) {
		if (
			error instanceof RequestError &&
			(error.status === 404 || error.status === 403)
		) {
			core.warning(
				`Couldn't write a comment to the pull-request. Please make sure your job has the permission 'pull-request: write'.
				 Original Error was: [${error.name}] - ${error.message}
				`,
			);
		} else {
			// Rethrow to handle it in the catch block of the run()-call.
			throw error;
		}
	}

	await summary.write();
};

function getMarkerPostfix({
	name,
	workingDirectory,
}: { name: string; workingDirectory: string }) {
	if (name) return name;
	if (workingDirectory !== "./") return workingDirectory;
	return "root";
}

function getWorkflowSummaryURL() {
	const { owner, repo } = github.context.repo;
	const { runId } = github.context;
	return `${github.context.serverUrl}/${owner}/${repo}/actions/runs/${runId}`;
}

run()
	.then(() => {
		core.info("Report generated successfully.");
	})
	.catch((err) => {
		core.error(err);
	});
