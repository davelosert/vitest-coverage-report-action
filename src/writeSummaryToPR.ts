import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "./octokit";
import { getWorkflowSummaryURL } from "./report/getWorkflowSummaryURL.js";

// GitHub caps issue/PR bodies and comments at 65536 characters.
const MAX_BODY_LENGTH = 65536;

const COMMENT_MARKER = (markerPostfix = "root") =>
	`<!-- vitest-coverage-report-marker-${markerPostfix} -->`;
const START_MARKER_PREFIX = "<!-- vitest-coverage-report-marker-start-";
const START_MARKER = (markerPostfix = "root") =>
	`${START_MARKER_PREFIX}${markerPostfix} -->`;
const END_MARKER = (markerPostfix = "root") =>
	`<!-- vitest-coverage-report-marker-end-${markerPostfix} -->`;

const oversizeStub = () =>
	`⚠️ Coverage report too large to inline, see the [workflow summary](${getWorkflowSummaryURL()}).`;

// The first report that fits within `limit`, else undefined. `reports` runs
// from the fullest version to the shortest.
const firstThatFits = (
	reports: string[],
	limit: number,
	wrap: (report: string) => string,
): string | undefined => reports.map(wrap).find((body) => body.length <= limit);

const writeSummaryToPR = async ({
	octokit,
	summary,
	markerPostfix,
	prNumber,
	shorterReports = [],
}: {
	octokit: Octokit;
	summary: typeof core.summary;
	markerPostfix?: string;
	prNumber?: number;
	/**
	 * Shorter versions of the report, tried in order when the full one is over
	 * GitHub's size limit, before falling back to a stub that links to the
	 * workflow summary.
	 */
	shorterReports?: string[];
}) => {
	// The user-defined pull request number takes precedence
	if (!prNumber) {
		core.info("No pull-request-number found. Skipping comment creation.");
		return;
	}

	const reports = [summary.stringify(), ...shorterReports];

	// If the PR body carries our marker pair, inject there and post no comment.
	if (await tryInjectIntoBody({ octokit, reports, markerPostfix, prNumber })) {
		return;
	}

	const marker = COMMENT_MARKER(markerPostfix);
	const commentBody =
		firstThatFits(
			reports,
			MAX_BODY_LENGTH,
			(report) => `${report}\n\n${marker}`,
		) ?? `${oversizeStub()}\n\n${marker}`;
	const existingComment = await findCommentByBody(octokit, marker, prNumber);

	if (existingComment) {
		await octokit.rest.issues.updateComment({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			comment_id: existingComment.id,
			body: commentBody,
		});
	} else {
		await octokit.rest.issues.createComment({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			issue_number: prNumber,
			body: commentBody,
		});
	}
};

// Returns true when the report was injected into the PR body between the
// start/end markers. Returns false (so the caller posts a comment) when the
// markers are absent, or emits a warning and returns false when they are
// malformed (only one present, or end before start).
async function tryInjectIntoBody({
	octokit,
	reports,
	markerPostfix,
	prNumber,
}: {
	octokit: Octokit;
	reports: string[];
	markerPostfix?: string;
	prNumber: number;
}): Promise<boolean> {
	const { data: pullRequest } = await octokit.rest.pulls.get({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		pull_number: prNumber,
	});

	const body = pullRequest.body ?? "";
	const start = START_MARKER(markerPostfix);
	const end = END_MARKER(markerPostfix);
	const startIdx = body.indexOf(start);
	const endIdx = body.indexOf(end);

	if (startIdx === -1 && endIdx === -1) {
		return false;
	}

	if (startIdx === -1 || endIdx === -1 || endIdx < startIdx + start.length) {
		core.warning(
			`Found incomplete coverage markers in the pull request body. Expected both "${start}" and "${end}" with the start before the end. Falling back to a comment.`,
		);
		return false;
	}

	const before = body.slice(0, startIdx + start.length);
	const after = body.slice(endIdx);
	const stub = oversizeStub();

	// Reserve one stub's worth of room per other marker region so sibling runs
	// can still write their own region into the shared body. Empty regions are
	// the ones that still need to grow. The +2 accounts for the newlines that
	// wrap each injected region.
	const otherRegions = Math.max(0, countStartMarkers(body) - 1);
	const margin = otherRegions * (stub.length + 2);

	const newBody =
		firstThatFits(
			reports,
			MAX_BODY_LENGTH - margin,
			(report) => `${before}\n${report}\n${after}`,
		) ?? `${before}\n${stub}\n${after}`;

	await octokit.rest.pulls.update({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		pull_number: prNumber,
		body: newBody,
	});

	return true;
}

function countStartMarkers(body: string): number {
	let count = 0;
	let idx = body.indexOf(START_MARKER_PREFIX);
	while (idx !== -1) {
		count++;
		idx = body.indexOf(START_MARKER_PREFIX, idx + START_MARKER_PREFIX.length);
	}
	return count;
}

async function findCommentByBody(
	octokit: Octokit,
	commentBodyIncludes: string,
	pullRequestNumber: number,
) {
	const commentsIterator = octokit.paginate.iterator(
		octokit.rest.issues.listComments,
		{
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			issue_number: pullRequestNumber,
		},
	);

	for await (const { data: comments } of commentsIterator) {
		const comment = comments.find((comment) =>
			comment.body?.includes(commentBodyIncludes),
		);
		if (comment) return comment;
	}

	return;
}

export { writeSummaryToPR };
