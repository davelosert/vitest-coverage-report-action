import { markdownTable } from 'markdown-table';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { generateSummaryTableData } from './generateSummaryTableData.js';
import { JsonSummary } from './types/JsonSummary';
import * as core from '@actions/core';
import { writeSummaryToPR } from './writeSummaryToPR.js';

const DEFAULT_SUMMARY_PATH = path.join('coverage', 'coverage-summary.json');

const run = async () => {
  const jsonSummaryPath = path.resolve(process.cwd(), DEFAULT_SUMMARY_PATH);
  const jsonSummaryRaw = await readFile(jsonSummaryPath);
  const jsonSummary: JsonSummary = JSON.parse(jsonSummaryRaw.toString());

  const tableData = generateSummaryTableData(jsonSummary);

  const summary = core.summary
    .addHeading('Coverage Summary')
    .addTable(tableData)

  await writeSummaryToPR(summary);
  await summary.write();
};

await run();
