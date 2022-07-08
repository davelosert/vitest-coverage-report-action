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
    return await parseJsonReport<JsonSummary>(jsonSummaryPath);
  } catch (err: any) {
    core.error(`
        Failed to parse the json-summary at path "${jsonSummaryPath}."
        Make sure to run vitest before this action and to include the "json-summay" reporter.

        Original Error:
        ${err.stack}
    `);
    core.setFailed('coverage-summary.json not found - exiting.');

    // rethrow to abort everything
    throw err;

  }
}

const parseJsonFinal = async (jsonFinalPath: string): Promise<JsonFinal> => {
  try {
    return await parseJsonReport<JsonFinal>(jsonFinalPath);
  } catch (err: any) {
    core.warning(`
      Failed to parse JSON Final at path "${jsonFinalPath}".
      Line coverage will be empty. To include it, make sure to include the "json" reporter in your vitest execution.

      Original Error:
      ${err.stack}
    `);
    return {};
  }
};

export {
  parseJsonSummary,
  parseJsonFinal
};
