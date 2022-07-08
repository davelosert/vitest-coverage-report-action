import { readFile } from 'node:fs/promises';
import * as core from '@actions/core';
import path from 'node:path';
import { JsonFinal } from './types/JsonFinal';
import { JsonSummary } from './types/JsonSummary';

const parseJsonReport = async <type extends JsonSummary | JsonFinal>(jsonSummaryPath: string): Promise<type> => {
  const resolvedJsonSummaryPath = path.resolve(process.cwd(), jsonSummaryPath);
  const jsonSummaryRaw = await readFile(resolvedJsonSummaryPath);
  return JSON.parse(jsonSummaryRaw.toString()) as type;
}

const parseJsonSummary = async (jsonSummaryPath: string): Promise<JsonSummary> => {
  try {
    return parseJsonReport<JsonSummary>(jsonSummaryPath);
  } catch (err) {
    core.error(`
        Failed to parse json summary at path "${jsonSummaryPath}."
        Make sure to run vitest before this action an use the "json-summay" reporter.
    `);
    core.setFailed('coverage-summary.json not found - exiting.');

    // rethrow to abort everything
    throw err;

  }
}

const parseJsonFinal = async (jsonFinalPath: string): Promise<JsonFinal> => {
  try {
    return parseJsonReport<JsonFinal>(jsonFinalPath);
  } catch (err) {
    core.warning(`
      Failed to parse JSON Final at path "${jsonFinalPath}".
      Line coverage will be empty. To include make sure to set the "json" reporter in your vitest configuration.
    `);
    return {};
  }
};

export {
  parseJsonSummary,
  parseJsonFinal
};
