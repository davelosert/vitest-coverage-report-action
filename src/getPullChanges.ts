import * as github from '@actions/github';
import * as core from '@actions/core';
import { FileCoverageModes } from './fileCoverageModes'

export async function getPullChanges(fileCoverageMode: FileCoverageModes): Promise<string[]> {
  // Skip Changes collection if we don't need it
  if (fileCoverageMode === FileCoverageModes.None) {
    return [];
  }

  // Skip Changes collection if we can't do it
  if (!github.context.payload?.pull_request) {
    return [];
  }

  const gitHubToken = core.getInput('github-token').trim();
  const prNumber = github.context.payload.pull_request.number
  try {
    const client = new github.GitHub(gitHubToken)
    const per_page = 100
    const paths: string[] = []

    core.startGroup(`Fetching list of changed files for PR#${prNumber} from Github API`)
    for await (const response of client.paginate.iterator(
      client.pulls.listFiles.endpoint.merge({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: prNumber,
        per_page
      })
    ) as AsyncIterableIterator<any>) {
      if (response.status !== 200) {
        throw new Error(`Fetching list of changed files from GitHub API failed with error code ${response.status}`)
      }
      core.info(`Received ${response.data.length} items`)

      for (const row of response.data) {
        core.debug(`[${row.status}] ${row.filename}`)
        if (['added', 'modified'].includes(row.status)) {
          paths.push(row.filename)
        }
      }
    }
    return paths
  } finally {
    core.endGroup()
  }
}

