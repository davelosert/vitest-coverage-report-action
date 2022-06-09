import { markdownTable } from 'markdown-table';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { generateTableFrom } from './generateTableData.js';
import { JsonSummary } from './types/JsonSummary';
import * as core from '@actions/core';

const DEFAULT_SUMMARY_PATH = path.join('coverage', 'coverage-summary.json');

const run = async () => {
  const jsonSummaryPath = path.resolve(process.cwd(), DEFAULT_SUMMARY_PATH);
  const jsonSummaryRaw = await readFile(jsonSummaryPath);
  const jsonSummary: JsonSummary = JSON.parse(jsonSummaryRaw.toString());
  
  const tableData = generateTableFrom(jsonSummary);
  const table = markdownTable(tableData, {
    align: ['l', 'l', 'l', 'c'],
  });
  
  console.log(table);
};

await run();
