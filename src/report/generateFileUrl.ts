import * as github from "@actions/github";

const generateBlobFileUrl = (relativeFilePath: string, commitSHA: string) => {
	return [
		github.context.serverUrl,
		github.context.repo.owner,
		github.context.repo.repo,
		"blob",
		commitSHA,
		relativeFilePath,
	].join("/");
};

export { generateBlobFileUrl };
