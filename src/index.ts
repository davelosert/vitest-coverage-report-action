import { generateSummaryTableData } from './generateSummaryTableHtml.js';
import path from 'node:path';
import { parseJsonFinal, parseJsonSummary } from './parseJsonReports.js';
import { writeSummaryToPR } from './writeSummaryToPR.js';
import * as core from '@actions/core';
import { parseThresholds } from './parseThresholds.js';
import { generateFileCoverageHtml } from './generateFileCoverageHtml.js';

const run = async () => {
  const jsonSummaryPath = path.resolve(core.getInput('json-summary-path'));
  const jsonFinalPath = path.resolve(core.getInput('json-final-path'));
  const viteConfigPath = path.resolve(core.getInput('vite-config-path'));

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
