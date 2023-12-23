import { readFile } from 'node:fs/promises';
import * as core from '@actions/core';
import path from 'node:path';
import { JsonFinal } from '../types/JsonFinal';
import { JsonSummary } from '../types/JsonSummary';
import { stripIndent } from 'common-tags';

const parseVitestCoverageReport = async <type extends JsonSummary | JsonFinal>(jsonPath: string): Promise<type> => {
  const resolvedJsonSummaryPath = path.resolve(process.cwd(), jsonPath);
  const jsonSummaryRaw = await readFile(resolvedJsonSummaryPath);
  return JSON.parse(jsonSummaryRaw.toString()) as type;
}

const parseVitestJsonSummary = async (jsonSummaryPath: string): Promise<JsonSummary> => {
  try {
    return await parseVitestCoverageReport<JsonSummary>(jsonSummaryPath);
  } catch (err: any) {
    core.setFailed(stripIndent`
        Failed to parse the json-summary at path "${jsonSummaryPath}."
        Make sure to run vitest before this action and to include the "json-summary" reporter.

        Original Error:
        ${err.stack}
    `);

    // Rethrow to abort the entire workflow
    throw err;

  }
}

const parseVitestJsonFinal = async (jsonFinalPath: string): Promise<JsonFinal> => {
  try {
    return await parseVitestCoverageReport<JsonFinal>(jsonFinalPath);
  } catch (err: any) {
    core.warning(stripIndent`
      Failed to parse JSON Final at path "${jsonFinalPath}".
      Line coverage will be empty. To include it, make sure to include the "json" reporter in your vitest execution.

      Original Error:
      ${err.stack}
    `);
    return {};
  }
};

export {
  parseVitestJsonSummary,
  parseVitestJsonFinal,
};
