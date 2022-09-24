import { generateSummaryTableData } from './generateSummaryTableHtml.js';
import path from 'node:path';
import { parseVitestJsonFinal, parseVitestJsonSummary } from './parseJsonReports.js';
import { writeSummaryToPR } from './writeSummaryToPR.js';
import * as core from '@actions/core';
import { parseCoverageThresholds } from './parseThresholds.js';
import { generateFileCoverageHtml } from './generateFileCoverageHtml.js';

const run = async () => {
  // Working directory can be used to modify all default/provided paths (for monorepos, etc)
  const workingDirectory = core.getInput('working-directory');

  const jsonSummaryPath = path.resolve(workingDirectory, core.getInput('json-summary-path'));
  const jsonFinalPath = path.resolve(workingDirectory, core.getInput('json-final-path'));
  const viteConfigPath = path.resolve(workingDirectory, core.getInput('vite-config-path'));

  const jsonSummary = await parseVitestJsonSummary(jsonSummaryPath);
  const jsonFinal = await parseVitestJsonFinal(jsonFinalPath);
  const thresholds = await parseCoverageThresholds(viteConfigPath);

  const tableData = generateSummaryTableData(jsonSummary.total, thresholds);
  const fileTable = generateFileCoverageHtml({
    jsonSummary, jsonFinal 
  });

  let summaryHeading = "Coverage Summary";
  if (workingDirectory) {
    summaryHeading += ` for \`${workingDirectory}\``;
  }

  const summary = core.summary
    .addHeading(summaryHeading, 2)
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
