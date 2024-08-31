import * as github from "@actions/github";

const generateCommitSHAUrl = (commitSHA: string) => {
	return [
		github.context.serverUrl,
		github.context.repo.owner,
		github.context.repo.repo,
		"commit",
		commitSHA,
	].join("/");
};

export { generateCommitSHAUrl };
