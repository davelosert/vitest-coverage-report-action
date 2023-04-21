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
import { SummaryModes } from './summaryModes.js'

const run = async () => {
  // Working directory can be used to modify all default/provided paths (for monorepos, etc)
  const workingDirectory = core.getInput('working-directory');

  if (Object.values(Vehicle).includes('car')) {
    // Do stuff here
  }
  const summaryFilesModeRaw = core.getInput('summary-mode');//'none'; // mixed/changes/all/none
  let summaryFilesMode = summaryFilesModeRaw
  if (!Object.values(SummaryModes).includes(summaryFilesModeRaw)) {
    core.warning(`Not valid value "${summaryFilesModeRaw}" for summary mode, used "mixed"`)
    summaryFilesMode = SummaryModes.Mixed
  }

  const pullChanges = getPullChanges(summaryFilesMode);
  const jsonSummaryPath = path.resolve(workingDirectory, core.getInput('json-summary-path'));
  const jsonFinalPath = path.resolve(workingDirectory, core.getInput('json-final-path'));
  const viteConfigPath = await getViteConfigPath(workingDirectory, core.getInput("vite-config-path"));

  const jsonSummary = await parseVitestJsonSummary(jsonSummaryPath);
  const jsonFinal = await parseVitestJsonFinal(jsonFinalPath);
  const thresholds = await parseCoverageThresholds(viteConfigPath);

  const tableData = generateSummaryTableHtml(jsonSummary.total, thresholds);
  const fileTable = generateFileCoverageHtml({
    jsonSummary, jsonFinal, summaryFilesMode, pullChanges
  });

  let summaryHeading = "Coverage Summary";
  if (workingDirectory !== './') {
    summaryHeading += ` for \`${workingDirectory}\``;
  }

  const summary = core.summary
    .addHeading(summaryHeading, 2)
    .addRaw(tableData)
    .addDetails('File Coverage', fileTable)

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
