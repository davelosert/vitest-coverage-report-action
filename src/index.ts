import { generateSummaryTableData } from './generateSummaryTableData.js';
import path from 'node:path';
import { parseJsonReport } from './parseJsonReports.js';
import { writeSummaryToPR } from './writeSummaryToPR.js';
import * as core from '@actions/core';
import { parseThresholds } from './parseThresholds.js';
import { JsonSummary } from './types/JsonSummary.js';
import { JsonFinal } from './types/JsonFinal.js';
import { generateFileCoverageHtml } from './generateFileCoverageHtml.js';

const run = async () => {
  // get action input for json-summary-path
  const jsonSummaryPath = path.resolve(core.getInput('json-summary-path'));
  const jsonFinalPath = path.resolve(core.getInput('json-final-path'));
  const viteConfigPath = path.resolve(core.getInput('vite-config-path'));
  const jsonSummary = await parseJsonReport<JsonSummary>(jsonSummaryPath);
  const jsonFinal = await parseJsonReport<JsonFinal>(jsonFinalPath);
  const thresholds = await parseThresholds(viteConfigPath);

  const tableData = generateSummaryTableData(jsonSummary.total, thresholds);
  const fileTable = generateFileCoverageHtml({
    jsonSummary, jsonFinal, thresholds
  })


  const summary = core.summary
    .addHeading('Coverage Summary')
    .addTable(tableData)
    .addDetails('Details', fileTable)

  await writeSummaryToPR(summary);
  await summary.write();
};

run().then(() => {
  core.info('Report generated successfully.');
});
