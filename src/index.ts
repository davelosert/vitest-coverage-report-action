import { generateSummaryTableHtml } from './generateSummaryTableHtml.js';
import path from 'node:path';
import { parseVitestJsonFinal, parseVitestJsonSummary } from './parseJsonReports.js';
import { writeSummaryToPR } from './writeSummaryToPR.js';
import * as core from '@actions/core';
import { RequestError } from '@octokit/request-error'
import { parseCoverageThresholds } from './parseCoverageThresholds.js';
import { generateFileCoverageHtml } from './generateFileCoverageHtml.js';
import { getViteConfigPath } from './getViteConfigPath.js';
import { getPullChanges } from './getPullChanges.js';
import { FileCoverageModes } from './fileCoverageModes'

const run = async () => {
  // Working directory can be used to modify all default/provided paths (for monorepos, etc)
  const workingDirectory = core.getInput('working-directory');

  const fileCoverageModeRaw = core.getInput('file-coverage-mode'); // all/changes/none
  let fileCoverageMode: FileCoverageModes;
  if (!Object.values(FileCoverageModes).includes(fileCoverageModeRaw)) {
    core.warning(`Not valid value "${fileCoverageModeRaw}" for summary mode, used "changes"`)
    fileCoverageMode = FileCoverageModes.Changes
  } else {
    fileCoverageMode = FileCoverageModes[fileCoverageModeRaw]
  }

  const jsonSummaryPath = path.resolve(workingDirectory, core.getInput('json-summary-path'));
  const viteConfigPath = await getViteConfigPath(workingDirectory, core.getInput("vite-config-path"));

  const jsonSummary = await parseVitestJsonSummary(jsonSummaryPath);
  const thresholds = await parseCoverageThresholds(viteConfigPath);

  const tableData = generateSummaryTableHtml(jsonSummary.total, thresholds);

  let summaryHeading = "Coverage Summary";
  if (workingDirectory !== './') {
    summaryHeading += ` for \`${workingDirectory}\``;
  }

  const summary = core.summary
    .addHeading(summaryHeading, 2)
    .addRaw(tableData)

  if (fileCoverageMode !== FileCoverageModes.None) {
    const pullChanges = await getPullChanges(fileCoverageMode);
    const jsonFinalPath = path.resolve(workingDirectory, core.getInput('json-final-path'));
    const jsonFinal = await parseVitestJsonFinal(jsonFinalPath);
    const fileTable = generateFileCoverageHtml({
      jsonSummary, jsonFinal, fileCoverageMode, pullChanges
    });
    summary.addDetails('File Coverage', fileTable)
  }

  try {
    await writeSummaryToPR(summary);
  } catch (error) {
    if (error instanceof RequestError && (error.status === 404 || error.status === 403)) {
      core.warning(
        `Couldn't write a comment to the pull-request. Please make sure your job has the permission 'pull-request: write'.`
      )
    } else {
      // Rethrow to handle it in the catch block of the run()-call.
      throw error;
    }
  }

  await summary.write();
};

run().then(() => {
  core.info('Report generated successfully.');
}).catch((err) => {
  core.error(err);
});
