import { constants, promises as fs } from "node:fs";
import path from "node:path";
import * as core from "@actions/core";
import { stripIndent } from "common-tags";

const testFilePath = async (workingDirectory: string, filePath: string) => {
	const resolvedPath = path.resolve(workingDirectory, filePath);
	await fs.access(resolvedPath, constants.R_OK);
	return resolvedPath;
};

const defaultPaths = [
	"vitest.config.ts",
	"vitest.config.mts",
	"vitest.config.cts",
	"vitest.config.js",
	"vitest.config.mjs",
	"vitest.config.cjs",
	"vite.config.ts",
	"vite.config.mts",
	"vite.config.cts",
	"vite.config.js",
	"vite.config.mjs",
	"vite.config.cjs",
	"vitest.workspace.ts",
	"vitest.workspace.mts",
	"vitest.workspace.cts",
	"vitest.workspace.js",
	"vitest.workspace.mjs",
	"vitest.workspace.cjs",
];

const getViteConfigPath = async (workingDirectory: string, input: string) => {
	try {
		if (input === "") {
			return await Promise.any(
				defaultPaths.map((filePath) =>
					testFilePath(workingDirectory, filePath),
				),
			);
		}

		return await testFilePath(workingDirectory, input);
	} catch (error) {
		const searchPath = input
			? path.resolve(workingDirectory, input)
			: `any default location in "${workingDirectory}"`;

		core.warning(stripIndent`
          Failed to read vite config file at ${searchPath}.
          Make sure you provide the vite-config-path option if you're using a non-default location or name of your config file.

          Will not include thresholds in the final report.
      `);
		return null;
	}
};

export { getViteConfigPath };
