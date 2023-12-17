# vitest-coverage-report-action

A GitHub Action to report [vitest](https://vitest.dev/) coverage results as a GitHub step-summary and pull request comment.

![Coverage Report as Step Summary](./docs/coverage-report.png)

It will create a high-level coverage summary for all coverage-category as well as a file-based report linking to the files itself and the uncovered lines for easy discovery.

## Usage

This action requires you to use `vitest` to create a coverage report with the following reporters:

- `json-summary` (required): Will add a high-level summary of your overall coverage
- `json` (optional): If provided, will add file-specific coverage reports for any file of your project

You can configure the reporters within the `vitest.config.js` file likes this:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    coverage: {
      // you can include other reporters, but 'json-summary' is required, json is recommended
      reporter: ['text', 'json-summary', 'json'],
    }
  }
});
```

Then execute `npx vitest --coverage` in a step before this action.

### Example Workflow

```yml
name: 'Test'
on: 
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    
    permissions:
      # Required to checkout the code
      contents: read
      # Required to put a comment into the pull-request
      pull-requests: write

    steps:
    - uses: actions/checkout@v2
    - name: 'Install Node'
      uses: actions/setup-node@v2
      with:
        node-version: '16.x'
    - name: 'Install Deps'
      run: npm install
    - name: 'Test'
      run: npx vitest --coverage
    - name: 'Report Coverage'
      if: always() # Also generate the report if tests are failing
      uses:  davelosert/vitest-coverage-report-action@v2
```

> [!NOTE]
> If you want to have comments on pull requests coming from forks, you will have to use the configuration as provided in the section [Working with pull requests from forks](#working-with-pull-requests-from-forks)

### Required Permissions

This action requires permissions set to `pull-request: write` in order for it to be able to add a comment to your pull-request. If you are using the default `GITHUB_TOKEN`, make sure to include the permissions together with `contents: read` to the the job, so that the `actions/checkout` action is allowed to checkout the repository. This is especially important for new repositories created after [GitHub's announcement](https://github.blog/changelog/2023-02-02-github-actions-updating-the-default-github_token-permissions-to-read-only/) to change the default permissions to `read-only` for all new `GITHUB_TOKEN`s.

### Options

| Option               | Description                                                                                                                           | Default                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `json-summary-path`  | The path to the json summary file.                                                                                                    | `./coverage/coverage-summary.json`                       |
| `json-final-path`    | The path to the json final file.                                                                                                      | `./coverage/coverage-final.json`                         |
| `vite-config-path`   | The path to the vite config file. Will check the same paths as vite and vitest                                                        | Checks pattern `vite[st].config.{t\|mt\|ct\|j\|mj\|cj}s` |
| `github-token`       | A GitHub access token with permissions to write to issues (defaults to `secrets.GITHUB_TOKEN`).                                       | `${{ github.token }}`                                    |
| `working-directory`  | Run action within a custom directory (for monorepos).                                                                                 | `./`                                                     |
| `name`               | Give the report a name. This is useful if you want multiple reports for different test suites within the same PR. Needs to be unique. | ''                                                       |
| `file-coverage-mode` | Defines how file-based coverage is reported. Possible values are `all`, `changes` or `none`.                                          | `changes`                                                |

#### File Coverage Mode

- `changes` - show Files coverage only for project files changed in that pull request (works only with `pull_request`, `pull_request_review`, `pull_request_review_comment` actions)
- `all` - show it grouped by changed and not changed files in that pull request (works only with `pull_request`, `pull_request_review`, `pull_request_review_comment` actions)
- `none` - do not show any File coverage details (only total Summary)

#### Name

If you have multiple test-suites but want to report the coverage in a single PR, you have to provide a unique `name` for each action-step that parses a summary-report, e.g.:

```yml
## ...
    - name: 'Report Frontend Coverage'
      if: always() # Also generate the report if tests are failing
      uses:  davelosert/vitest-coverage-report-action@v2
      with:
        name: 'Frontend'
        json-summary-path: './coverage/coverage-summary-frontend.json'
        json-final-path: './coverage/coverage-final-frontend.json
    - name: 'Report Backend Coverage'
      if: always() # Also generate the report if tests are failing
      uses:  davelosert/vitest-coverage-report-action@v2
      with:
        name: 'Backend'
        json-summary-path: './coverage/coverage-summary-backend.json'
        json-final-path: './coverage/coverage-final-backend.json'
```

### Coverage Thresholds

This action will read the coverage thresholds defined in the `coverage`-property of the `vite.config.js`-file and mark the status of the generated report accordingly.

E.g. with a config like this:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    coverage: {
      lines: 60,
      branches: 60,
      functions: 60,
      statements: 60
    }
  }
});
```

the report would look like this:

![Coverage Threshold Report](./docs/coverage-report-threshold.png)

If there are no thresholds defined, the status will be '🔵'.

### Workspaces

If you are using a monorepo with [Vitest Workspaces](https://vitest.dev/guide/workspace.html) and you run Vitest from the root of your project, Vitest will ignore the `coverage`-property of the individual project-level `vite.config.js`-files. This is because some of the [configuration options](https://vitest.dev/guide/workspace.html#configuration) are not allowed in a project config, for example coverage is done for the whole workspace.

In this case, you can create a `vite.config.js`-file in the root of your project next to your `vitest.workspace.js`-file to configure coverage for the whole workspace:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    coverage: {
      // you can include other reporters, but 'json-summary' is required, json is recommended
      reporter: ['text', 'json-summary', 'json'],
    }
  }
});
```

Alternatively, you can provide [coverage options](https://vitest.dev/config/#coverage) to CLI with dot notation:

```sh
npx vitest --coverage.enabled --coverage.provider=v8 --coverage.reporter=json-summary --coverage.reporter=json
```

### Working with pull requests from forks

Due to security considerations, GitHub Actions does not provide workflows originating from a fork with write access to your repository, even if such permissions are configured. Consequently, this action cannot comment on these pull requests using the above-documented configuration.

For more information on why this is the case, refer to the following article:
[Preventing Pwn-Requests](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/).

However, you can circumvent this limitation by dividing your workflow into two separate workflows (see examples below):

1. **Testing Workflow**: This workflow runs tests in response to the `pull_request` trigger, within the context of the actual pull request, and uploads the coverage reports as artifacts.
    > ![IMPORTANT]
    > This workflow must reside within your default branch (`main`)!
2. **Reporting Workflow**: This workflow is triggered upon the completion of the **Testing Workflow** using the `workflow_runs` event. It downloads and parses the coverage report, and posts a comment on the pull request.

This action will automatically detect:

- If it is being run within a `workflow_run` trigger
- If the triggering workflow was a pull request

It will then automatically locate the appropriate pull request to comment on.

#### Example

- **test.yml**

    ```yml
    name: "Test"
    on:
      pull_request:

    jobs:
      test:
        runs-on: ubuntu-latest

        permissions:
          contents: read

        steps:
          - uses: actions/checkout@v4
          - name: "Install Node"
            uses: actions/setup-node@v4
            with:
              node-version: "18.x"
          - name: "Install Deps"
            run: npm install
          - name: "Test"
            run: npx vitest --coverage

          - name: "Upload Coverage"
            uses: actions/upload-artifact@v4
            with:
              name: coverage
              path: coverage
    ```

- **coverage.yml** (has to be on the default branch)

    ```yml
    name: Report Coverage

    on:
      workflow_run:
        workflows: ["Test"]
        types:
          - completed

    jobs:
      report:
        runs-on: ubuntu-latest

        permissions:
          pull-requests: write

        steps:
          - uses: actions/checkout@v4
          - uses: actions/download-artifact@v4
            with:
              github-token: ${{ secrets.GITHUB_TOKEN }}
              run-id: ${{ github.event.workflow_run.id }}
          - name: "Report Coverage"
            uses: davelosert/vitest-coverage-report-action@v2
    ```

> ![NOTE]
> This configuration also works for pull requests originating from your own repository (not forks), so it can be used generally.

#### Limitations & Considerations

This approach has a few limitations:

- The **Reporting Workflow** is only triggered after the **Testing Workflow** completes. As a result, there will be a (most likely neglectable) delay before a comment appears on the pull request.
- To obtain the pull request number from a forked pull request, it's necessary to iterate over all pull requests in the repository using the [Pulls REST API](https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests) and match it by the `head_sha`. This is due to the `github` context of the triggering workflow not containing the pull request information ([see this discussion](https://github.com/orgs/community/discussions/25220)). While this is generally not an issue, it could cause delays if the repository is large and the pull request is significantly old.
- Since the **Reporting Workflow** runs in the context of your repository's default branch, changes to your coverage threshold won't be reflected in the pull request comment. This can be mitigated by also uploading the Vite config as an artifact in the **Testing Workflow**.
