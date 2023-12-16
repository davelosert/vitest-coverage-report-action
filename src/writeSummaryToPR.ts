import * as github from '@actions/github';
import * as core from '@actions/core';



const COMMENT_MARKER = (markerPostfix = 'root') => `<!-- vitest-coverage-report-marker-${markerPostfix} -->`;
type Octokit =  ReturnType<typeof github.getOctokit>;
const writeSummaryToPR = async ({ summary, markerPostfix }: { 
	summary: typeof core.summary; 
	markerPostfix?: string;
}) => {
  const gitHubToken = core.getInput('github-token').trim();
  const octokit: Octokit = github.getOctokit(gitHubToken);
  
  // If in the context of a pull-request, get the pull-request number
  let pullRequestNumber = github.context.payload.pull_request?.number;

  // If in the context of a workflow run, get the origin workflow_run id and use it to query the original workflow to get the pull_request number
  if (github.context.eventName === 'workflow_run') {
    core.info('Trying to get triggering workflow to find pull-request Id to comment on...')
    const originalWorkflowRunId = github.context.payload.workflow_run?.id;
    if (!originalWorkflowRunId) {
      core.info('[vitest-coverage-report] No original workflow run id found. Skipping comment creation.');
      return;
    }
    const originalWorkflowRun = await octokit.rest.actions.getWorkflowRun({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      run_id: originalWorkflowRunId,
    });
    
    if(!originalWorkflowRun.data.pull_requests || originalWorkflowRun.data.pull_requests.length === 0) {
      core.info('[vitest-coverage-report] No pull-request found in the original workflow run. Skipping comment creation.');
      return;
    }

    pullRequestNumber = originalWorkflowRun.data.pull_requests[0].number;
  }


  if (!pullRequestNumber) {
    core.info('[vitest-coverage-report] No pull-request-number found. Skipping comment creation.');
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

  return undefined;
}


export {
  writeSummaryToPR
};
