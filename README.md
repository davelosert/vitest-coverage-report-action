# vitest-coverage-report-action

A GitHub Action to report [vitest](https://vitest.dev/) coverage results as a GitHub step-summary and Pull-Request comment.

![Coverage Report as Step Summary](./docs/coverage-report.png)

It will create a high-level coverage summary for all coverage-category as well as a file-based report linking to the files itself and the uncovered lines for easy discovery.

## Usage

This action requires you to use `vitest` to create a coverage report with the `json-summary`-reporter and optionally the `json`-reporter (if you don't provide it, uncovered lines won't appear in the report).

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
      uses:  davelosert/vitest-coverage-report-action@v1
```

### Required Permissions

This action requires permissions set to `pull-request: write` in order for it to be able to add a comment to your pull-request. If you are using the default `GITHUB_TOKEN`, make sure to include the permissions together with `contents: read` to the the job, so that the `actions/checkout` action is allowed to checkout the repository. This is especially important for new repositories created after [GitHub's announcement](https://github.blog/changelog/2023-02-02-github-actions-updating-the-default-github_token-permissions-to-read-only/) to change the default permissions to `read-only` for all new `GITHUB_TOKEN`s.

### Options

| Option              | Description                                                                                                        | Default                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `json-summary-path` | The path to the json summary file.                                                                                 | `./coverage/coverage-summary.json` |
| `json-final-path`   | The path to the json final file.                                                                                   | `./coverage/coverage-final.json`   |
| `vite-config-path`  | The path to the vite config file. Will check the same paths as vite and vitest                                     | Checks pattern `vite[st].config.{t | mt | ct | j | mj | cj}s` |
| `comment-pr`        | Set this to `false` to deactivate commenting on a PR (can be useful if the report is too large for comment-bodies) | true                               |

| `github-token`      | A GitHub access token with permissions to write to issues (defaults to `secrets.GITHUB_TOKEN`). | `${{ github.token }}`              |
| `working-directory` | Run action within a custom directory (for monorepos).                                           | `./`                               |

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
