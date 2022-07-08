import * as github from '@actions/github';

const generateBlobFileUrl = (relativeFilePath: string) => {
  const sha = github.context.payload.pull_request ? 
  github.context.payload.pull_request.head.sha
  : github.context.sha

  return [
    github.context.serverUrl,
    github.context.repo.owner,
    github.context.repo.repo,
    'blob',
    sha,
    relativeFilePath
  ].join('/')
};

export { generateBlobFileUrl };
