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

  // Paths will be resolved to absolute filepaths from 'path.resolve' call (get defaults from Action inputs)
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

  // Indicate working directory (if set) in Action summary for easier understanding (ie. in a monorepo)
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
