import path from 'node:path';
import * as core from '@actions/core';
import { promises as fs } from 'fs';
import { Thresholds } from '../types/Threshold';
import {VitestConfig} from "../types/VitestConfig";

const parseCoverageThresholds = async (vitestConfigPath: string): Promise<Thresholds> => {
  try {
    const resolvedViteConfigPath = path.resolve(process.cwd(), vitestConfigPath);
    const rawContent = await fs.readFile(resolvedViteConfigPath, 'utf8');
    const vitestConfig: VitestConfig = JSON.parse(rawContent);

    const coverageThresholds = vitestConfig.coverage?.thresholds;

    if (coverageThresholds["100"]) {
      return {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      };
    }

    return {
      lines: coverageThresholds?.lines,
      branches: coverageThresholds?.branches,
      functions: coverageThresholds?.functions,
      statements: coverageThresholds?.statements,
    };
  } catch (err: unknown) {
    core.warning(`Could not read vite config file for thresholds due to an error:\n ${err}`);
    return {};
  }
};

export {
  parseCoverageThresholds,
};
