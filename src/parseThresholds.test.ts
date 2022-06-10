import { describe, it, expect } from 'vitest';
import path from 'path';
import { parseThresholds } from './parseThresholds';

// get current dir name in module environment by url
const moduleDir = path.dirname(new URL(import.meta.url).pathname);

describe('generateTableData', () => {
  const mockConfigPath = path.resolve(moduleDir, '..', 'test', 'mockConfig');
  const getConfig = (configName: string) => path.resolve(mockConfigPath, configName)
    
  it('reads all the thresholds from the given configuration file.', async (): Promise<void> => {
    const thresholds = await parseThresholds(getConfig('vitest.config.all.js'));
    
    expect(thresholds).toEqual({
      lines: 60,
      branches: 70,
      functions: 80,
      statements: 90
    });
  });
  
  
  it('sets thresholds to 100 if 100 property is true.', async (): Promise<void> => {
    const thresholds = await parseThresholds(getConfig('vitest.config.100.js'));
    
    expect(thresholds).toEqual({
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100 
    });
  });
});
