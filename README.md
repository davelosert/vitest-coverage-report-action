# vitest-coverage-report-action

A GitHub Action to report [vitest](https://vitest.dev/) coverage results as a GitHub step-summary and Pull-Request comment.

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

### Required Permissions

This action requires permissions set to `pull-request: write` in order for it to be able to add a comment to your pull-request. If you are using the default `GITHUB_TOKEN`, make sure to include the permissions together with `contents: read` to the the job, so that the `actions/checkout` action is allowed to checkout the repository. This is especially important for new repositories created after [GitHub's announcement](https://github.blog/changelog/2023-02-02-github-actions-updating-the-default-github_token-permissions-to-read-only/) to change the default permissions to `read-only` for all new `GITHUB_TOKEN`s.

### Options

| Option              | Description                                                                                     | Default                            |
| ------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------- |
| `json-summary-path` | The path to the json summary file.                                                              | `./coverage/coverage-summary.json` |
| `json-final-path`   | The path to the json final file.                                                                | `./coverage/coverage-final.json`   |
| `vite-config-path`  | The path to the vite config file. Will check the same paths as vite and vitest                  | Checks pattern `vite[st].config.{t\|mt\|ct\|j\|mj\|cj}s`               |
| `github-token`      | A GitHub access token with permissions to write to issues (defaults to `secrets.GITHUB_TOKEN`). | `${{ github.token }}`              |
| `working-directory` | Run action within a custom directory (for monorepos).                                           | `./`                               |
| `name` | Give the report a name. This is useful if you want multiple reports for different test suites within the same PR. Needs to be unique. | '' |
| `file-coverage-mode`| Defines how file-based coverage is reported. Possible values are `all`, `changes` or `none`.                          | `changes`                              |

#### File Coverage Mode

* `changes` - show Files coverage only for project files changed in that pull request (works only with `pull_request`, `pull_request_review`, `pull_request_review_comment` actions)
* `all` - show it grouped by changed and not changed files in that pull request (works only with `pull_request`, `pull_request_review`, `pull_request_review_comment` actions)
* `none` - do not show any File coverage details (only total Summary)

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
