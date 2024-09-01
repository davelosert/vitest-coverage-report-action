import * as core from "@actions/core";

type CommentOn = "pr" | "commit" | "none";

function getCommentOn(): CommentOn[] {
	const commentOnInput = core.getInput("comment-on");
	if (commentOnInput === "none") {
		return [];
	}

	const commentOnList = commentOnInput.split(",").map((item) => item.trim());

	let validCommentOnValues: Array<CommentOn> = [];
	const invalidCommentOnValues: string[] = [];

	for (const value of commentOnList) {
		if (value === "pr" || value === "commit") {
			validCommentOnValues.push(value as CommentOn);
		} else {
			invalidCommentOnValues.push(value);
		}
	}

	if (validCommentOnValues.length === 0) {
		core.warning(
			`No valid options for comment-on found. Falling back to default value "pr".`,
		);
		validCommentOnValues = ["pr"];
		return validCommentOnValues;
	}

	if (invalidCommentOnValues.length > 0) {
		core.warning(
			`Invalid options for comment-on: ${invalidCommentOnValues.join(", ")}. Valid options are "pr" and "commit".`,
		);
	}

	return validCommentOnValues;
}

export { getCommentOn };

export type { CommentOn };
