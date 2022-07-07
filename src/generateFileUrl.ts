import * as github from '@actions/github';

const generateBlobFileUrl = (relativeFilePath: string) => {
  return [
    github.context.serverUrl,
    github.context.repo.owner,
    github.context.repo.repo,
    'blob',
    github.context.sha,
    relativeFilePath
  ].join('/')
};

export { generateBlobFileUrl };
