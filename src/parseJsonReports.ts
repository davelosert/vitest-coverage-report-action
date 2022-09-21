import { readFile } from 'node:fs/promises';
import * as core from '@actions/core';
import path from 'node:path';
import { JsonFinal } from './types/JsonFinal';
import { JsonSummary } from './types/JsonSummary';
import { stripIndent } from 'common-tags';

/** Parse a Vitest coverage reporter file */
const parseJsonReport = async <type extends JsonSummary | JsonFinal>(jsonPath: string): Promise<type> => {
  // Input path may already be an absolute path (will shortcut 'path.resolve' call).
  const resolvedJsonSummaryPath = path.resolve(process.cwd(), jsonPath);
  const jsonSummaryRaw = await readFile(resolvedJsonSummaryPath);
  return JSON.parse(jsonSummaryRaw.toString()) as type;
}

/**
 * Parse Vitest coverage 'json-summary' reporter file
 *
 * @throws Errors when parsing fails
 */
const parseJsonSummary = async (jsonSummaryPath: string): Promise<JsonSummary> => {
  try {
    return await parseJsonReport<JsonSummary>(jsonSummaryPath);
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

/** Parse Vitest coverage 'json' reporter file */
const parseJsonFinal = async (jsonFinalPath: string): Promise<JsonFinal> => {
  try {
    return await parseJsonReport<JsonFinal>(jsonFinalPath);
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
  parseJsonSummary,
  parseJsonFinal
};
