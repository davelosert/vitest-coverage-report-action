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

	it("renders an equal sign for files without changes to coverage", () => {
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

	it("shows comparison for all files when comparison data is available", () => {
		const changedFilePath = path.join(workspacePath, "src", "changedFile.ts");
		const unchangedFilePath = path.join(
			workspacePath,
			"src",
			"unchangedFile.ts",
		);

		const jsonSummary: JsonSummary = createMockJsonSummary({
			[changedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 80 }),
			}),
			[unchangedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 90 }),
			}),
		});

		const jsonSummaryCompare: JsonSummary = createMockJsonSummary({
			[changedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 70 }),
			}),
			[unchangedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 80 }),
			}),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: ["src/changedFile.ts"],
			commitSHA: "test-sha",
			workspacePath,
		});

		// Changed file should have comparison
		expect(html).toContain("src/changedFile.ts");
		expect(html).toContain(`${icons.increase} <em>+10.00%</em>`);

		// Unchanged file with coverage change should appear in Affected Files section
		const affectedFileSection = html.split("Affected Files")[1];
		expect(affectedFileSection).toContain("src/unchangedFile.ts");
		expect(affectedFileSection).toContain(`${icons.increase} <em>+10.00%</em>`);
	});

	it("shows only changed and affected files in changes-affected mode", () => {
		const changedFilePath = path.join(workspacePath, "src", "changedFile.ts");
		const affectedFilePath = "src/affectedFile.ts";
		const unaffectedFilePath = "src/unaffectedFile.ts";

		const jsonSummary: JsonSummary = createMockJsonSummary({
			[changedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 80 }),
			}),
			[affectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 90 }),
			}),
			[unaffectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 75 }),
			}),
		});

		const jsonSummaryCompare: JsonSummary = createMockJsonSummary({
			[changedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 70 }),
			}),
			[affectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 80 }),
			}),
			[unaffectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 75 }),
			}),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.ChangesAffected,
			pullChanges: ["src/changedFile.ts"],
			commitSHA: "test-sha",
			workspacePath,
		});

		// Should have Changed Files section
		expect(html).toContain("Changed Files");
		expect(html).toContain("src/changedFile.ts");

		// Should have Affected Files section with coverage comparison
		expect(html).toContain("Affected Files");
		expect(html).toContain("src/affectedFile.ts");
		expect(html).toContain(`${icons.increase} <em>+10.00%</em>`);

		// Should NOT have unaffected files
		expect(html).not.toContain("src/unaffectedFile.ts");
	});

	it("separates affected and unaffected files in all mode", () => {
		const changedFilePath = path.join(workspacePath, "src", "changedFile.ts");
		const affectedFilePath = "src/affectedFile.ts";
		const unaffectedFilePath = "src/unaffectedFile.ts";

		const jsonSummary: JsonSummary = createMockJsonSummary({
			[changedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 80 }),
			}),
			[affectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 90 }),
			}),
			[unaffectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 75 }),
			}),
		});

		const jsonSummaryCompare: JsonSummary = createMockJsonSummary({
			[changedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 70 }),
			}),
			[affectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 80 }),
			}),
			[unaffectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 75 }),
			}),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: ["src/changedFile.ts"],
			commitSHA: "test-sha",
			workspacePath,
		});

		// Should have Changed Files section
		expect(html).toContain("Changed Files");
		expect(html).toContain("src/changedFile.ts");

		// Should have Affected Files section with files that have coverage changes
		expect(html).toContain("Affected Files");
		const affectedSection = html
			.split("Affected Files")[1]
			.split("Unchanged Files")[0];
		expect(affectedSection).toContain("src/affectedFile.ts");
		expect(affectedSection).toContain(`${icons.increase} <em>+10.00%</em>`);

		// Should have Unchanged Files section with files that have no coverage changes (no comparison data)
		expect(html).toContain("Unchanged Files");
		const unchangedSection = html.split("Unchanged Files")[1];
		expect(unchangedSection).toContain("src/unaffectedFile.ts");
		// Unchanged files should NOT show comparison data
		expect(unchangedSection).not.toContain(icons.equal);
		expect(unchangedSection).not.toContain(icons.increase);
		expect(unchangedSection).not.toContain(icons.decrease);
	});

	it("ensures affected files only appear in affected section and not in unaffected section in all mode", () => {
		const changedFilePath = path.join(workspacePath, "src", "changedFile.ts");
		const affectedFilePath = path.join(workspacePath, "src", "affectedFile.ts");
		const unaffectedFilePath = path.join(
			workspacePath,
			"src",
			"unaffectedFile.ts",
		);

		const jsonSummary: JsonSummary = createMockJsonSummary({
			[changedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 80 }),
			}),
			[affectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 90 }),
			}),
			[unaffectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 75 }),
			}),
		});

		const jsonSummaryCompare: JsonSummary = createMockJsonSummary({
			[changedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 70 }),
			}),
			[affectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 80 }),
			}),
			[unaffectedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 75 }),
			}),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: ["src/changedFile.ts"],
			commitSHA: "test-sha",
			workspacePath,
		});

		// Verify Changed Files section contains only changed file
		const changedSection = html
			.split("Changed Files")[1]
			.split("Affected Files")[0];
		expect(changedSection).toContain("src/changedFile.ts");
		expect(changedSection).not.toContain("src/affectedFile.ts");
		expect(changedSection).not.toContain("src/unaffectedFile.ts");

		// Verify Affected Files section contains only affected file
		const affectedSection = html
			.split("Affected Files")[1]
			.split("Unchanged Files")[0];
		expect(affectedSection).toContain("src/affectedFile.ts");
		expect(affectedSection).not.toContain("src/changedFile.ts");
		expect(affectedSection).not.toContain("src/unaffectedFile.ts");

		// Verify Unchanged Files section contains only unchanged file
		const unchangedSection = html.split("Unchanged Files")[1];
		expect(unchangedSection).toContain("src/unaffectedFile.ts");
		expect(unchangedSection).not.toContain("src/changedFile.ts");
		expect(unchangedSection).not.toContain("src/affectedFile.ts");

		// Count table rows to ensure each file appears exactly once
		const affectedFileRows = html
			.split("<tr>")
			.filter((row) => row.includes("src/affectedFile.ts"));
		expect(affectedFileRows.length).toBe(1);

		const unaffectedFileRows = html
			.split("<tr>")
			.filter((row) => row.includes("src/unaffectedFile.ts"));
		expect(unaffectedFileRows.length).toBe(1);
	});

	it("uses custom decimal places in file comparisons", () => {
		const changedFilePath = path.join(workspacePath, "src", "changedFile.ts");

		const jsonSummary: JsonSummary = createMockJsonSummary({
			[changedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 80.12345 }),
			}),
		});

		const jsonSummaryCompare: JsonSummary = createMockJsonSummary({
			[changedFilePath]: createMockCoverageReport({
				branches: createMockReportNumbers({ pct: 70 }),
			}),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonSummaryCompare,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: ["src/changedFile.ts"],
			commitSHA: "test-sha",
			workspacePath,
			comparisonDecimalPlaces: 4,
		});

		expect(html).toContain("+10.1235%");
	});
});
