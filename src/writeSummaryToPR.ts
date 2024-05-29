import * as github from '@actions/github';
import * as core from '@actions/core';

const gitHubToken = core.getInput('github-token').trim();
const octokit: Octokit = github.getOctokit(gitHubToken);
const COMMENT_MARKER = (markerPostfix = 'root') => `<!-- vitest-coverage-report-marker-${markerPostfix} -->`;

type Octokit = ReturnType<typeof github.getOctokit>;
const writeSummaryToPR = async ({ summary, markerPostfix, userDefinedPrNumber }: {
  summary: typeof core.summary;
  markerPostfix?: string;
  userDefinedPrNumber?: number;
}) => {
  // If in the context of a pull-request, get the pull-request number
  let pullRequestNumber = github.context.payload.pull_request?.number;

  // This is to allow commenting on pull_request from forks
  if (github.context.eventName === 'workflow_run') {
    pullRequestNumber = await getPullRequestNumberFromTriggeringWorkflow(octokit);
  }

  if (!pullRequestNumber && userDefinedPrNumber) {
    pullRequestNumber = userDefinedPrNumber;
  }

  if (!pullRequestNumber) {
    core.info('No pull-request-number found. Skipping comment creation.');
    return;
  }

  const commentBody = `${summary.stringify()}\n\n${COMMENT_MARKER(markerPostfix)}`;
  const existingComment = await findCommentByBody(octokit, COMMENT_MARKER(markerPostfix), pullRequestNumber);

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
      issue_number: pullRequestNumber,
      body: commentBody,
    });
  }
}

async function findCommentByBody(octokit: Octokit, commentBodyIncludes: string, pullRequestNumber: number) {
  const commentsIterator = octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pullRequestNumber,
    }
  );

  for await (const { data: comments } of commentsIterator) {
    const comment = comments.find((comment) => comment.body?.includes(commentBodyIncludes));
    if (comment) return comment;
  }

  return;
}

async function getPullRequestNumberFromTriggeringWorkflow(octokit: Octokit): Promise<number | undefined> {
  core.info('Trying to get the triggering workflow in order to find the pull-request-number to comment the results on...')
  const originalWorkflowRunId = github.context.payload.workflow_run!.id;

  const { data: originalWorkflowRun } = await octokit.rest.actions.getWorkflowRun({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    run_id: originalWorkflowRunId,
  });

  if (originalWorkflowRun.event !== 'pull_request') {
    core.info('The triggering workflow is not a pull-request. Skipping comment creation.');
    return undefined;
  }

  // When the actual pull-request is not coming from a fork, the pull_request object is correctly populated and we can shortcut here
  if (originalWorkflowRun.pull_requests && originalWorkflowRun.pull_requests.length > 0) {
    return originalWorkflowRun.pull_requests[0].number;
  }

  // When the actual pull-request is coming from a fork, the pull_request object is not populated (see https://github.com/orgs/community/discussions/25220)
  core.info(`Trying to find the pull-request for the triggering workflow run with id: ${originalWorkflowRunId} (${originalWorkflowRun.url}) with HEAD_SHA ${originalWorkflowRun.head_sha}...`)

  // The way to find the pull-request in this scenario is to query all existing pull_requests on the target repository and find the one with the same HEAD_SHA as the original workflow run
  const pullRequest = await findPullRequest(octokit, originalWorkflowRun.head_sha);

  if (!pullRequest) {
    core.info('Could not find the pull-request for the triggering workflow run. Skipping comment creation.');
    return undefined;
  }

  return pullRequest.number;
}


async function findPullRequest(octokit: Octokit, headSha: string) {
  core.startGroup(`Querying REST API for Pull-Requests.`);
  const pullRequestsIterator = octokit.paginate.iterator(
    octokit.rest.pulls.list, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    per_page: 30
  });

  for await (const { data: pullRequests } of pullRequestsIterator) {
    core.info(`Found ${pullRequests.length} pull-requests in this page.`)
    for (const pullRequest of pullRequests) {
      core.debug(`Comparing: ${pullRequest.number} sha: ${pullRequest.head.sha} with expected: ${headSha}.`)
      if (pullRequest.head.sha === headSha) {
        return pullRequest
      }
    }
  }
  core.endGroup();
  return undefined;
}


export {
  writeSummaryToPR
};
