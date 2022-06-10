import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { JsonSummary } from './types/JsonSummary';

const parseJsonSummary = async (jsonSummaryPath: string): Promise<JsonSummary> => {
  const resolvedJsonSummaryPath = path.resolve(process.cwd(), jsonSummaryPath);
  const jsonSummaryRaw = await readFile(resolvedJsonSummaryPath);
  return JSON.parse(jsonSummaryRaw.toString()) as JsonSummary;
}

export {
  parseJsonSummary
};
