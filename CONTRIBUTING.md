# Contributing

Hi there! I'm thrilled that you'd like to contribute to this project. Your help is essential for keeping it great. So first of all: Thank you!

## Contributions how to

If you'd like to contribute in any shape or form, be it by either reporting or fixing a bug, requesting or implementing a new feature or just generally improving this project, please follow the process outlined below.

Contributions to this project are [released](https://help.github.com/articles/github-terms-of-service/#6-contributions-under-repository-license) to the public under the [MIT License](LICENSE).

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

> [!NOTE]
> Found a security vulnerability? Please follow the process outlined in [SECURITY.md](SECURITY.md).

### 1. Searching and/or Creating an Issue

Do this step in any case - be it that you just want to report something, or if you want to implement a feature or fix yourself.

1. [Search the existing issues][issues] to see if someone else didn't already beat you to it. If you find a similar issue, you can upvote it with a 👍 reaction or add your comment.
2. If no issue exists, [create a new Issue][create-issue] to discuss the bug or feature with the community and me. Even if you would like to fix/implement it yourself, this is a good idea to avoid any unnecessary work on your side (in case I already implemented it or have some initial feedback about it).

If I ask you for a pull request, continue with the next steps.

### 2. Submitting a pull request

#### Prerequisites for running and testing code

You need to install [NodeJS & NPM](https://nodejs.org/en) to be able to test your changes locally as part of the pull request (PR) submission process.

#### Making and proposing changes

1. [Fork][fork] and clone the repository.
2. Create a new branch: `git checkout -b my-branch-name`.
3. Configure and install the dependencies: `npm install`.
4. Make sure the tests pass on your machine: `npm run test`.
5. Make sure linter passes on your machine: `npm run lint` (powered by [biome.js][biome]).
6. Make your change(s), add tests, and make sure the tests and linter still pass.
  6.1. In case the linters fail, use `npm run lint:write` to automatically fix all automatically fixable issues. Fix the rest manually.
7. You do not need to include changes to `dist/`, they will be integrated into the repository as part of a release process after your pr is merged.
8. Push to your fork and [submit a pull request][pr].
9. Pat your self on the back and wait for your pull request to be reviewed and merged.

#### Coding Guidelines

Here are a few things you can do that will increase the likelihood of your pull request being accepted:

- Write tests.
- Keep the formatting in line with the [biome.js][biome] rules. (Tip: You can run `npm run lint:ci` to check the formatting and `npm run lint:write` to automatically fix all automatically fixable issue.)
- Keep your change as focused as possible. If there are multiple changes you would like to make that are not dependent upon each other, consider submitting them as separate pull requests.
- Write a [good commit message](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).
- Don't introduce any unnecessary dependencies. I try to keep this repository as free from dependencies as possible to avoid entering maintenance-hell as well as unnecessarily introducing supply-chain security-threats.

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)

[fork]: https://github.com/davelosert/vitest-coverage-report-action/fork
[pr]: https://github.com/davelosert/vitest-coverage-report-action/compare
[issues]: https://github.com/davelosert/vitest-coverage-report-action/issues
[create-issue]: https://github.com/davelosert/vitest-coverage-report-action/issues/new
[biome]: https://biomejs.dev/
