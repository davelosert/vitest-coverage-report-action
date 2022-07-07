import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { JsonFinal } from './types/JsonFinal';
import { JsonSummary } from './types/JsonSummary';

const parseJsonReport = async <type extends JsonSummary | JsonFinal>(jsonSummaryPath: string): Promise<type> => {
  const resolvedJsonSummaryPath = path.resolve(process.cwd(), jsonSummaryPath);
  const jsonSummaryRaw = await readFile(resolvedJsonSummaryPath);
  return JSON.parse(jsonSummaryRaw.toString()) as type;
}

export {
  parseJsonReport
};
