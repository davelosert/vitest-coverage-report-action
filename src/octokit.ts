import * as github from "@actions/github";
import * as core from '@actions/core';

type Octokit = ReturnType<typeof github.getOctokit>;

const createOctokit = (): Octokit => {
  const token = core.getInput("github-token").trim();
  return github.getOctokit(token);
}

export {
  createOctokit,
}

export type {
  Octokit,
}
