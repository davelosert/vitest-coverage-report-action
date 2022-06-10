import { generateSummaryTableData } from './generateSummaryTableData.js';
import path from 'node:path';
import { parseJsonSummary } from './parseJsonSummary.js';
import { writeSummaryToPR } from './writeSummaryToPR.js';
import * as core from '@actions/core';
import { parseThresholds } from './parseThresholds.js';

const DEFAULT_SUMMARY_PATH = path.join('coverage', 'coverage-summary.json');
const DEFAULT_VITEST_CONFIG_PATH = path.join('vitest.config.js');

const run = async () => {
  const jsonSummary = await parseJsonSummary(DEFAULT_SUMMARY_PATH);
  const thresholds = await parseThresholds(DEFAULT_VITEST_CONFIG_PATH);

  const tableData = generateSummaryTableData(jsonSummary, thresholds);

  const summary = core.summary
    .addHeading('Coverage Summary')
    .addTable(tableData)

  await writeSummaryToPR(summary);
  await summary.write();
};

run().then(() => {
  core.info('Report generated successfully.');
});
