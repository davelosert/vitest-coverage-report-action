import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTableLine } from "../../test/queryHelper";
import { icons } from "../icons";
import { FileCoverageMode } from "../inputs/FileCoverageMode";
import type { JsonFinal } from "../types/JsonFinal";
import { createJsonFinalEntry } from "../types/JsonFinalMockFactory";
import type { JsonSummary } from "../types/JsonSummary";
import {
	createMockCoverageReport,
	createMockJsonSummary,
	createMockReportNumbers,
} from "../types/JsonSummaryMockFactory";
import { generateFileCoverageHtml } from "./generateFileCoverageHtml";

const workspacePath = process.cwd();
describe("generateFileCoverageHtml()", () => {
	beforeEach(() => {
		vi.stubEnv("GITHUB_REPOSITORY", "owner/repo");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.clearAllMocks();
	});

	it("renders only the unchanged files if no changed files exist.", () => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			"src/generateFileCoverageHtml.ts": createMockCoverageReport(),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare: undefined,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: [],
			commitSHA: "test-sha",
			workspacePath: process.cwd(),
		});

		const firstTableLine = getTableLine(1, html);

		expect(firstTableLine).toContain("Unchanged Files");
	});

	it("renders changed files before unchanged files.", () => {
		const relativeChangedFilePath = "src/changedFile.ts";
		const jsonSummary: JsonSummary = createMockJsonSummary({
			"src/unchangedFile.ts": createMockCoverageReport(),
			[path.join(workspacePath, "src", "changedFile.ts")]:
				createMockCoverageReport(),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare: undefined,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: [relativeChangedFilePath],
			commitSHA: "test-sha",
			workspacePath: process.cwd(),
		});

		expect(getTableLine(1, html)).toContain("Changed Files");
		expect(getTableLine(2, html)).toContain(relativeChangedFilePath);
		expect(getTableLine(3, html)).toContain("Unchanged Files");
		expect(getTableLine(4, html)).toContain("src/unchangedFile.ts");
	});

	it("only renders unchanged files if the fileCoverageMode is set to All but only unchanged files exist.", () => {
		const changedFileName = "src/changedFile.ts";
		const jsonSummary: JsonSummary = createMockJsonSummary({
			[changedFileName]: createMockCoverageReport(),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare: undefined,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: [changedFileName],
			commitSHA: "test-sha",
			workspacePath: process.cwd(),
		});

		expect(html).not.toContain("Unchanged Files");
	});

	it("renders statement that no changed files were found if the fileCoverageMode is set to Changed but no changed files exist.", () => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			"src/unchangedFile.ts": createMockCoverageReport(),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare: undefined,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.Changes,
			pullChanges: [],
			commitSHA: "test-sha",
			workspacePath: process.cwd(),
		});

		expect(html).toContain("No changed files found.");
	});

	it("renders the statements, branches, functions and line coverage-percentage of a file.", () => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			"src/generateFileCoverageHtml.ts": {
				statements: createMockReportNumbers({ pct: 70 }),
				branches: createMockReportNumbers({ pct: 80 }),
				functions: createMockReportNumbers({ pct: 90 }),
				lines: createMockReportNumbers({ pct: 100 }),
			},
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare: undefined,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: [],
			commitSHA: "test-sha",
			workspacePath: process.cwd(),
		});

		const tableLine = getTableLine(2, html);

		expect(tableLine).toContain("70%");
		expect(tableLine).toContain("80%");
		expect(tableLine).toContain("90%");
		expect(tableLine).toContain("100%");
	});

	it("renders the line-coverage in the same row as the coverage.", async (): Promise<void> => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			"src/exampleFile.ts": createMockCoverageReport({
				statements: createMockReportNumbers({ pct: 70 }),
			}),
		});
		const jsonFinal: JsonFinal = {
			...createJsonFinalEntry("src/exampleFile.ts", [
				{ line: 1, covered: false },
				{ line: 2, covered: false },
			]),
		};

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare: undefined,
			jsonFinal,
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: [],
			commitSHA: "test-sha",
			workspacePath: process.cwd(),
		});

		const tableLine = getTableLine(2, html);

		expect(tableLine).toContain("70%");
		expect(tableLine).toContain("1-2");
		expect(tableLine).toContain("#L1-L2");
	});

	it("renders single line coverage without range.", async (): Promise<void> => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			"src/exampleFile.ts": createMockCoverageReport({
				statements: createMockReportNumbers({ pct: 70 }),
			}),
		});
		const jsonFinal: JsonFinal = {
			...createJsonFinalEntry("src/exampleFile.ts", [
				{ line: 2, covered: false },
			]),
		};

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonFinal,
			jsonSummaryCompare: undefined,
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: [],
			commitSHA: "test-sha",
			workspacePath: process.cwd(),
		});

		const tableLine = getTableLine(2, html);

		expect(tableLine).toContain("2");
		expect(tableLine).toContain("#L2");
	});

	it("renders non adjacent line coverage with multiple links.", async (): Promise<void> => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			"src/exampleFile.ts": createMockCoverageReport({
				statements: createMockReportNumbers({ pct: 70 }),
			}),
		});
		const jsonFinal: JsonFinal = {
			...createJsonFinalEntry("src/exampleFile.ts", [
				{ line: 2, covered: false },
				{ line: 3, covered: true },
				{ line: 4, covered: true },
				{ line: 5, covered: false },
				{ line: 6, covered: false },
			]),
		};

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare: undefined,
			jsonFinal,
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: [],
			commitSHA: "test-sha",
			workspacePath: process.cwd(),
		});

		const tableLine = getTableLine(2, html);

		expect(tableLine).toContain("#L2");
		expect(tableLine).toContain("#L5-L6");
	});

	it("renders an equal sign for files without changes to covergage", () => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			"file1.ts": createMockCoverageReport(),
		});

		const jsonSummaryCompare: JsonSummary = createMockJsonSummary({
			"file1.ts": createMockCoverageReport(),
		});
		const jsonFinal: JsonFinal = {
			...createJsonFinalEntry("src/exampleFile.ts", [
				{ line: 1, covered: true },
			]),
		};

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare,
			jsonFinal,
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: ["file1.ts"],
			commitSHA: "test-sha",
			workspacePath: process.cwd(),
		});

		expect(html).toContain("file1.ts");
		expect(html).toContain(icons.equal);
		const equalSignCount = (html.match(new RegExp(icons.equal, "g")) || [])
			.length;
		expect(equalSignCount).toBe(4);
	});

	it("renders a plus sign and the increased percentage for files with increased coverage", () => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			"file1.ts": createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 70 }),
			}),
		});

		const jsonSummaryCompare: JsonSummary = createMockJsonSummary({
			"file1.ts": createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 60 }),
			}),
		});
		const jsonFinal: JsonFinal = {
			...createJsonFinalEntry("src/exampleFile.ts", [
				{ line: 1, covered: true },
			]),
		};

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare,
			jsonFinal,
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: ["file1.ts"],
			commitSHA: "test-sha",
			workspacePath: process.cwd(),
		});

		expect(html).toContain("file1.ts");
		expect(html).toContain(`${icons.increase} <em>+10.00%</em>`);
		const equalSignCount = (html.match(new RegExp(icons.increase, "g")) || [])
			.length;
		expect(equalSignCount).toBe(1);
	});

	it("renders a minus sign and the decreased percentage for files with decreased coverage", () => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			"file1.ts": createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 70 }),
			}),
		});

		const jsonSummaryCompare: JsonSummary = createMockJsonSummary({
			"file1.ts": createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 80 }),
			}),
		});
		const jsonFinal: JsonFinal = {
			...createJsonFinalEntry("src/exampleFile.ts", [
				{ line: 1, covered: true },
			]),
		};

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare,
			jsonFinal,
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: ["file1.ts"],
			commitSHA: "test-sha",
			workspacePath: process.cwd(),
		});

		expect(html).toContain("file1.ts");
		expect(html).toContain(`${icons.decrease} <em>-10.00%</em>`);
		const equalSignCount = (html.match(new RegExp(icons.decrease, "g")) || [])
			.length;
		expect(equalSignCount).toBe(1);
	});

	it("correctly handles a different workspacePath than the current working directory", () => {
		const differentWorkspacePath = "/path/to/different/workspace";
		const filePath = path.join(differentWorkspacePath, "src", "exampleFile.ts");
		const relativeFilePath = "src/exampleFile.ts";

		const jsonSummary: JsonSummary = createMockJsonSummary({
			[filePath]: createMockCoverageReport(),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare: undefined,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: [relativeFilePath],
			commitSHA: "test-sha",
			workspacePath: differentWorkspacePath,
		});

		expect(html).toContain(relativeFilePath);
	});
});
