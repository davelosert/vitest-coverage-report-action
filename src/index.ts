import { generateSummaryTableData } from './generateSummaryTableHtml.js';
import path from 'node:path';
import { parseJsonFinal, parseJsonSummary } from './parseJsonReports.js';
import { writeSummaryToPR } from './writeSummaryToPR.js';
import * as core from '@actions/core';
import { parseThresholds } from './parseThresholds.js';
import { generateFileCoverageHtml } from './generateFileCoverageHtml.js';

const run = async () => {
  // Working directory can be used to modify all default/provided paths (for monorepos, etc)
  const workingDirectory = core.getInput('working-directory');
  // TODO: 'path.resolve' will always result in an absolute URL, defaulting to using the current working
  //         directory if no other absolute path was provided (from right to left). Therefore, joining
  //         with 'process.cwd()' later has no effect (since the input will already be an absolute path).
  //       Should likely clean up the unnecessary/duplicate 'path.resolve' usage where these variables are used?
  const jsonSummaryPath = path.resolve(workingDirectory, core.getInput('json-summary-path'));
  const jsonFinalPath = path.resolve(workingDirectory, core.getInput('json-final-path'));
  const viteConfigPath = path.resolve(workingDirectory, core.getInput('vite-config-path'));

  const jsonSummary = await parseJsonSummary(jsonSummaryPath);
  const jsonFinal = await parseJsonFinal(jsonFinalPath);
  const thresholds = await parseThresholds(viteConfigPath);

  const tableData = generateSummaryTableData(jsonSummary.total, thresholds);
  const fileTable = generateFileCoverageHtml({
    jsonSummary, jsonFinal 
  });

  const summary = core.summary
    .addHeading('Coverage Summary')
    .addRaw(tableData)
    .addDetails('File Coverage', fileTable)

  await writeSummaryToPR(summary);
  await summary.write();
};

run().then(() => {
  core.info('Report generated successfully.');
}).catch((err) => {
  core.error(err);
});
