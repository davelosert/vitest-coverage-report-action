import { Reporter } from "vitest";

export type VitestConfig = {
	include: string[];
	exclude: string[];
	includeSource: string[];
	server: VitestServerConfig;
	reporters: Reporter | Reporter[];
	outputFile: string | Record<string, string>
	deps: VitestDepsConfig;
	browser: VitestBrowserConfig;
	coverage: VitestCoverageConfig;
}

export type VitestServerConfig = {
	sourceMap: boolean;
	debug: VitestServerDebugConfig;

}

export type VitestServerDebugConfig = {
	dumpModules: boolean | string;
	loadDumppedModules: boolean;
}

export type VitestServerDebugDepsConfig = {
	external: (string | RegExp)[]
	inline: (string | RegExp)[]
	fallbackCJS: boolean;
	cacheDir: string;
}

export type VitestDepsConfig = {
	web: VitestDepWebConfig;
}

export type VitestDepWebConfig = {
	transformAssets: boolean;
	transformCss: boolean;
	transformGlobPattern: RegExp | RegExp[];
}

export type VitestBrowserConfig = {
	enabled: boolean;
	name: string;
	headless: boolean;
	isolate: boolean;
	api: number;
	provider: 'webdriverio' | 'playwright' | string;
}

export type VitestCoverageConfig = {
	enabled: boolean;
	provider: 'v8' | 'instanbul' | 'custom';
	thresholds: VitestCoverageThresholdsConfig;
}

export type VitestCoverageThresholdsConfig = {
	statements: number;
	branches: number;
	functions: number;
	lines: number;
	autoUpdate: boolean;
	100: boolean;
}
