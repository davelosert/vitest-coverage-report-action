import path from 'node:path';
import * as core from '@actions/core';
import { promises as fs } from 'fs';
import { Thresholds } from './types/Threshold';

const regex100 = /100"?\s*:\s*true/;
const regexStatements = /statements\s*:\s*(\d+)/;
const regexLines = /lines:\s*(\d+)/;
const regexBranches = /branches\s*:\s*(\d+)/;
const regexFunctions = /functions\s*:\s*(\d+)/;

const parseThresholds = async (vitestConfigPath: string): Promise<Thresholds> => {
  try {
    const resolvedViteConfigPath = path.resolve(process.cwd(), vitestConfigPath);
    const rawContent = await fs.readFile(resolvedViteConfigPath, 'utf8');

    const has100Value = rawContent.match(regex100);

    if(has100Value) {
      return {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      }
    }

    const lines = rawContent.match(regexLines);
    const branches = rawContent.match(regexBranches);
    const functions = rawContent.match(regexFunctions);
    const statements = rawContent.match(regexStatements);

    return {
      lines: lines ? parseInt(lines[1]) : undefined,
      branches: branches ? parseInt(branches[1]) : undefined,
      functions: functions ? parseInt(functions[1]) : undefined,
      statements: statements ? parseInt(statements[1]) : undefined,
    }
  } catch (err) {
    console.warn('Could not read vite config file for tresholds due to an error:', {
      error: err
    });
    return {};
  }
}

export {
  parseThresholds,
};
