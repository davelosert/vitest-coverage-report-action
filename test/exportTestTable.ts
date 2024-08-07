import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseVitestJsonSummary } from "../src/inputs/parseJsonReports";
import { generateSummaryTableHtml } from "../src/report/generateSummaryTableHtml";

const basePath = path.join(__dirname, "mockReports", "coverage");
const coveragePath = path.join(basePath, "coverage-summary.json");
const coverageComparePath = path.join(
	basePath,
	"coverage-summary-compare.json",
);

const targetPath = path.join(__dirname, "..", "tmp");

async function generateMarkdown() {
	// Parse the coverage reports
	const coverageSummary = await parseVitestJsonSummary(coveragePath);
	const coverageSummaryCompare =
		await parseVitestJsonSummary(coverageComparePath);

	// Generate the HTML table
	const htmlTable = generateSummaryTableHtml(
		coverageSummary.total,
		{
			branches: 60,
			functions: 50,
			lines: 40,
			statements: 20,
		},
		coverageSummaryCompare.total,
	);

	// Write the HTML into a markdown file
	await mkdir(targetPath, { recursive: true });
	await writeFile(path.join(targetPath, "coverage-summary.md"), htmlTable);
}

generateMarkdown().catch(console.error);
