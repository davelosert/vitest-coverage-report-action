import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "./octokit";

const COMMENT_MARKER = (markerPostfix = "root") =>
	`<!-- vitest-coverage-report-marker-${markerPostfix} -->`;

const writeSummaryToPR = async ({
	octokit,
	summary,
	markerPostfix,
	prNumber,
}: {
	octokit: Octokit;
	summary: typeof core.summary;
	markerPostfix?: string;
	prNumber?: number;
}) => {
	// The user-defined pull request number takes precedence
	if (!prNumber) {
		core.info("No pull-request-number found. Skipping comment creation.");
		return;
	}

	const commentBody = `${summary.stringify()}\n\n${COMMENT_MARKER(markerPostfix)}`;
	const existingComment = await findCommentByBody(
		octokit,
		COMMENT_MARKER(markerPostfix),
		prNumber,
	);

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
