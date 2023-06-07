import * as github from '@actions/github';
import * as core from '@actions/core';
import { FileCoverageMode } from './FileCoverageMode'

type Octokit =  ReturnType<typeof github.getOctokit>;

export async function getPullChanges(fileCoverageMode: FileCoverageMode): Promise<string[]> {
	// Skip Changes collection if we don't need it
	if (fileCoverageMode === FileCoverageMode.None) {
		return [];
	}

	// Skip Changes collection if we can't do it
	if (!github.context.payload?.pull_request) {
		return [];
	}

	const gitHubToken = core.getInput('github-token').trim();
	const prNumber = github.context.payload.pull_request.number
	try {
		const octokit: Octokit = github.getOctokit(gitHubToken);
		const paths: string[] = []

		core.startGroup(`Fetching list of changed files for PR#${prNumber} from Github API`)
		
		const iterator = octokit.paginate.iterator(
			octokit.rest.pulls.listFiles, {
				owner: github.context.repo.owner,
				repo: github.context.repo.repo,
				pull_number: prNumber,
				per_page: 100
			}
		);

		for await (const response of iterator) {
			if (response.status !== 200) {
				throw new Error(`Fetching list of changed files from GitHub API failed with error code ${response.status}`)
			}
			core.info(`Received ${response.data.length} items`)

			for (const file of response.data) {
				core.debug(`[${file.status}] ${file.filename}`)
				if (['added', 'modified'].includes(file.status)) {
					paths.push(file.filename)
				}
			}
		}
		return paths
	} finally {
		core.endGroup()
	}
}

