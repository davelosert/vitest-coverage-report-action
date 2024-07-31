import path from 'node:path';
import * as core from '@actions/core';
import { promises as fs } from 'fs';
import { VitestConfig } from "../types/VitestConfig";
import { Reporter } from "vitest";

export const parseViteConfigReporters = async (vitestConfigPath: string): Promise<Reporter | Reporter[]> => {
	try {
		const resolvedViteConfigPath = path.resolve(process.cwd(), vitestConfigPath);
		const rawContent = await fs.readFile(resolvedViteConfigPath, 'utf8');
		const vitestConfig: VitestConfig = JSON.parse(rawContent);

		const reporters = vitestConfig.reporters;
		if (reporters) {
			if (reporters instanceof Array) {
				let containsJsonSummaryReporter = false;
				for (const reporter of reporters) {
					if (typeof reporter === 'string') {
						if (reporter === 'json-summary') {
							containsJsonSummaryReporter = true;
						}
					}
				}
				if (!containsJsonSummaryReporter) {
					logMissingReporter();
				}
			}
			if (typeof reporters === 'string') {
				if (reporters !== 'json-summary') {
					logMissingReporter();
				}
			}
			return reporters;
		}
		logMissingReporter();
		return [];
	} catch (err: unknown) {
		core.warning(`Could not read vite config file for reporters due to an error:\n ${err}`);
		return {};
	}
};

const logMissingReporter = () => {
	core.error(`Reporter "json-summary" is missing. This is required`);
}
