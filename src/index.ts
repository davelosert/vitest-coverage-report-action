import { generateSummaryTableData } from './generateSummaryTableData.js';
import path from 'node:path';
import { parseJsonSummary } from './parseJsonSummary.js';
import { writeSummaryToPR } from './writeSummaryToPR.js';
import * as core from '@actions/core';
import { parseThresholds } from './parseThresholds.js';

const run = async () => {
  // get action input for json-summary-path
  const jsonSummaryPath = path.resolve(core.getInput('json-summary-path'));
  const viteConfigPath = path.resolve(core.getInput('vite-config-path'));
  const jsonSummary = await parseJsonSummary(jsonSummaryPath);
  const thresholds = await parseThresholds(viteConfigPath);

  const tableData = generateSummaryTableData(jsonSummary.total, thresholds);

  const summary = core.summary
    .addHeading('Coverage Summary')
    .addTable(tableData)

  await writeSummaryToPR(summary);
  await summary.write();
};

run().then(() => {
  core.info('Report generated successfully.');
});
