import * as core from "@actions/core";
import * as github from "@actions/github";
import { RequestError } from "@octokit/request-error";
import { FileCoverageMode } from "./inputs/FileCoverageMode.js";
import { getPullChanges } from "./inputs/getPullChanges.js";
import { type Options, readOptions } from "./inputs/options.js";
import {
	parseVitestJsonFinal,
	parseVitestJsonSummary,
} from "./inputs/parseJsonReports.js";
import { createOctokit, type Octokit } from "./octokit.js";
import { generateCommitSHAUrl } from "./report/generateCommitSHAUrl.js";
import { generateFileCoverageHtml } from "./report/generateFileCoverageHtml.js";
import { generateHeadline } from "./report/generateHeadline.js";
import { generateSummaryTableHtml } from "./report/generateSummaryTableHtml.js";
import { getWorkflowSummaryURL } from "./report/getWorkflowSummaryURL.js";
import type { JsonSummary } from "./types/JsonSummary.js";
import { writeSummaryToCommit } from "./writeSummaryToComment.js";
import { writeSummaryToPR } from "./writeSummaryToPR.js";

type GitHubSummary = typeof core.summary;

const run = async () => {
	const octokit = createOctokit();

	const options = await readOptions(octokit);
	core.info(`Using options: ${JSON.stringify(options, null, 2)}`);

	const jsonSummary = await parseVitestJsonSummary(options.jsonSummaryPath);

	let jsonSummaryCompare: JsonSummary | undefined;
	if (options.jsonSummaryComparePath) {
		jsonSummaryCompare = await parseVitestJsonSummary(
			options.jsonSummaryComparePath,
		);
	}

	const summaryTable = generateSummaryTableHtml(
		jsonSummary.total,
		options.thresholds,
		jsonSummaryCompare?.total,
		options.thresholdIcons,
		options.comparisonDecimalPlaces,
	);

	const commitSHAUrl = generateCommitSHAUrl(options.commitSHA);
	const footer = `<em>Generated in workflow <a href=${getWorkflowSummaryURL()}>#${github.context.runNumber}</a> for commit <a href="${commitSHAUrl}">${options.commitSHA.substring(0, 7)}</a> by the <a href="https://github.com/davelosert/vitest-coverage-report-action">Vitest Coverage Report Action</a></em>`;

	// Fills core.summary's buffer with the report, with or without a file table.
	const composeSummary = (fileTable: string | undefined): GitHubSummary => {
		const summary = core.summary
			.emptyBuffer()
			.addHeading(
				generateHeadline({
					workingDirectory: options.workingDirectory,
					name: options.name,
				}),
				2,
			)
			.addRaw(summaryTable);

		if (fileTable !== undefined) {
			if (options.fileCoverageExpanded) {
				summary.addRaw(
					`<details open><summary>File Coverage</summary>${fileTable}</details>\n`,
				);
			} else {
				summary.addDetails("File Coverage", fileTable);
			}
		}

		return summary.addRaw(footer);
	};

	let fileTable: string | undefined;
	// Shorter versions for a PR comment the full report would not fit into:
	// first without the uncovered-lines column (every range is a full URL),
	// then without the file table at all. The step summary keeps the full one.
	const shorterReports: string[] = [];

	if (options.fileCoverageMode !== FileCoverageMode.None) {
		const pullChanges = await getPullChanges({
			fileCoverageMode: options.fileCoverageMode,
			prNumber: options.prNumber,
			octokit,
		});

		const jsonFinal = await parseVitestJsonFinal(options.jsonFinalPath);
		const renderFileTable = (showUncoveredLines: boolean) =>
			generateFileCoverageHtml({
				jsonSummary,
				jsonSummaryCompare,
				jsonFinal,
				fileCoverageMode: options.fileCoverageMode,
				pullChanges,
				commitSHA: options.commitSHA,
				workspacePath: options.fileCoverageRootPath,
				comparisonDecimalPlaces: options.comparisonDecimalPlaces,
				showUncoveredLines,
				sortBy: options.sortBy,
			});

		fileTable = renderFileTable(options.showUncoveredLines);

		if (options.commentOn.includes("pr")) {
			if (options.showUncoveredLines) {
				shorterReports.push(composeSummary(renderFileTable(false)).stringify());
			}
			shorterReports.push(composeSummary(undefined).stringify());
		}
	}

	const summary = composeSummary(fileTable);

	if (options.commentOn.includes("pr")) {
		await commentOnPR(octokit, summary, options, shorterReports);
	}

	if (options.commentOn.includes("commit")) {
		await commentOnCommit(octokit, summary, options);
	}

	await summary.write();
};

function handleError(error: unknown, kind: string, permission: string) {
	if (error instanceof RequestError) {
		switch (error.status) {
			case 403:
			case 404:
				core.warning(
					`Couldn't write a comment to the ${kind}. Please make sure your job has the permission '${permission}: write'.\n` +
						`Original Error was: [${error.name}] - ${error.message}`,
				);
				return;
			case 422:
				core.warning(
					`Couldn't write a comment to the ${kind}. Summary was probably too large - See the step summary ${getWorkflowSummaryURL()} instead.\n` +
						`Original Error was: [${error.name}] - ${error.message}`,
				);
				return;
		}
	}
	throw error;
}

async function commentOnPR(
	octokit: Octokit,
	summary: GitHubSummary,
	options: Options,
	shorterReports: string[],
) {
	try {
		await writeSummaryToPR({
			octokit,
			summary,
			shorterReports,
			markerPostfix: getMarkerPostfix({
				name: options.name,
				workingDirectory: options.workingDirectory,
			}),
			prNumber: options.prNumber,
		});
	} catch (error) {
		handleError(error, "pull request", "pull-requests");
	}
}

async function commentOnCommit(
	octokit: Octokit,
	summary: GitHubSummary,
	options: Options,
) {
	try {
		await writeSummaryToCommit({
			octokit,
			summary,
			commitSha: options.commitSHA,
		});
	} catch (error) {
		handleError(error, "commit", "contents");
	}
}

function getMarkerPostfix({
	name,
	workingDirectory,
}: {
	name: string;
	workingDirectory: string;
}) {
	if (name) return name;
	if (workingDirectory !== "./") return workingDirectory;
	return "root";
}

run()
	.then(() => {
		core.info("Report generated successfully.");
	})
	.catch((err) => {
		core.error(err);
	});
