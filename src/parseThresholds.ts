import path from 'node:path';
import { Thresholds } from './types/Threshold';

import { loadConfigFromFile } from 'vite';

const parseThresholds = async (vitestConfigPath: string): Promise<Thresholds> => {
  const resolvedViteConfigPath = path.resolve(process.cwd(), vitestConfigPath);
  const configObj = await loadConfigFromFile({command: 'build', mode: 'production' }, resolvedViteConfigPath);

  if(!configObj) {
    return {};
  }

  const config = configObj.config;

  if(config.test?.coverage?.["100"]) {
    return {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100,
    }
  }
  
  return {
    lines: config.test?.coverage?.lines,
    branches: config.test?.coverage?.branches,
    functions: config.test?.coverage?.functions,
    statements: config.test?.coverage?.statements,
  }
}

export {
  parseThresholds
};
