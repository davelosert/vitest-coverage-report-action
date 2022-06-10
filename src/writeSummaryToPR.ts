import * as github from '@actions/github';
import * as core from '@actions/core';


const COMMENT_MARKER = '<!-- vitest-coverage-report-marker -->';
type Octokit =  ReturnType<typeof github.getOctokit>;

const writeSummaryToPR = async (summary: typeof core.summary) => {
  if (!github.context.payload.pull_request) {
    console.log('[vitest-coverage-report] Not in the context of a pull request. Skipping comment creation.');
    return;
  }
  
  const gitHubToken = core.getInput('github-token').trim();
  const octokit: Octokit = github.getOctokit(gitHubToken);
  
  const commentBody = `${summary.stringify()}\n\n${COMMENT_MARKER}`;
  const existingComment = await findCommentByBody(octokit, COMMENT_MARKER);

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
      issue_number: github.context.payload.pull_request.number,
      body: commentBody,
    });
  }


}

async function findCommentByBody(octokit: Octokit, commentBodyIncludes: string) {
  const commentsIterator = octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.payload.pull_request!.number,
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
