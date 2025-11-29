import { describe, expect, it } from "vitest";
import { getTableLine } from "../../test/queryHelper";
import { defaultThresholdIcons, icons } from "../icons";
import {
	createMockCoverageReport,
	createMockReportNumbers,
} from "../types/JsonSummaryMockFactory";
import type { ThresholdIcons } from "../types/ThresholdIcons";
import type { Thresholds } from "../types/Threshold";
import { generateSummaryTableHtml } from "./generateSummaryTableHtml";

describe("generateSummaryTabelHtml()", () => {
	it("generates the headline", () => {
		const mockReport = createMockCoverageReport();
		const summaryHtml = generateSummaryTableHtml(
			mockReport,
			undefined,
			undefined,
		);
		const headline = getTableLine(0, summaryHtml);

		expect(headline).toContain("Status");
		expect(headline).toContain("Category");
		expect(headline).toContain("Percentage");
		expect(headline).toContain("Covered / Total");
	});

	it("generates all categories as rows", async (): Promise<void> => {
		const mockReport = createMockCoverageReport();
		const summaryHtml = generateSummaryTableHtml(
			mockReport,
			undefined,
			undefined,
		);

		expect(getTableLine(1, summaryHtml)).toContain("Lines");
		expect(getTableLine(2, summaryHtml)).toContain("Statements");
		expect(getTableLine(3, summaryHtml)).toContain("Functions");
		expect(getTableLine(4, summaryHtml)).toContain("Branches");
	});

	it("adds status blue-circle if no threshold provided.", async (): Promise<void> => {
		const mockReport = createMockCoverageReport();
		const summaryHtml = generateSummaryTableHtml(
			mockReport,
			undefined,
			undefined,
		);

		expect(summaryHtml).toContain(icons.blue);
	});

	it("adds the percentage with a %-sign.", async (): Promise<void> => {
		const mockReport = createMockCoverageReport({
			lines: createMockReportNumbers({ pct: 80 }),
		});

		const summaryHtml = generateSummaryTableHtml(
			mockReport,
			undefined,
			undefined,
		);

		expect(getTableLine(1, summaryHtml)).toContain("80%");
	});

	it("shows the covered / total numbers.", async (): Promise<void> => {
		const mockReport = createMockCoverageReport({
			lines: createMockReportNumbers({
				covered: 8,
				total: 10,
			}),
		});

		const summaryHtml = generateSummaryTableHtml(
			mockReport,
			undefined,
			undefined,
		);

		expect(getTableLine(1, summaryHtml)).toContain("8 / 10");
	});

	it("shows blue-circle when vitest threshold is defined but no custom thresholdIcons provided.", async (): Promise<void> => {
		const thresholds: Thresholds = { lines: 80 };
		const mockReport = createMockCoverageReport({
			lines: createMockReportNumbers({
				pct: 81,
			}),
		});
		const summaryHtml = generateSummaryTableHtml(
			mockReport,
			thresholds,
			undefined,
			defaultThresholdIcons,
		);

		// With normalized behavior, default thresholdIcons (blue) is always used unless custom icons provided
		expect(getTableLine(1, summaryHtml)).toContain(icons.blue);
	});

	it("if threshold is given, provides the threshold in the category column.", async (): Promise<void> => {
		const thresholds: Thresholds = { lines: 100 };
		const mockReport = createMockCoverageReport({
			lines: createMockReportNumbers({
				pct: 80,
			}),
		});

		const summaryHtml = generateSummaryTableHtml(
			mockReport,
			thresholds,
			undefined,
		);

		expect(getTableLine(1, summaryHtml)).toContain("80% (🎯 100%)");
	});

	it("if compare report is given and coverage decreased, provides the difference in the percentage column.", async (): Promise<void> => {
		const mockReport = createMockCoverageReport({
			lines: createMockReportNumbers({
				pct: 80,
			}),
		});
		const mockCompareReport = createMockCoverageReport({
			lines: createMockReportNumbers({
				pct: 90,
			}),
		});

		const summaryHtml = generateSummaryTableHtml(
			mockReport,
			undefined,
			mockCompareReport,
		);

		expect(getTableLine(1, summaryHtml)).toContain(
			"80%<br/>⬇️ <em>-10.00%</em>",
		);
	});

	it("if compare report is given and coverage increased, provides the difference in the percentage column.", async (): Promise<void> => {
		const mockReport = createMockCoverageReport({
			lines: createMockReportNumbers({
				pct: 90,
			}),
		});
		const mockCompareReport = createMockCoverageReport({
			lines: createMockReportNumbers({
				pct: 80,
			}),
		});

		const summaryHtml = generateSummaryTableHtml(
			mockReport,
			undefined,
			mockCompareReport,
		);

		expect(getTableLine(1, summaryHtml)).toContain(
			"90%<br/>⬆️ <em>+10.00%</em>",
		);
	});

	it("if compare report is given and coverage stayed the same, provides the difference in the percentage column.", async (): Promise<void> => {
		const mockReport = createMockCoverageReport({
			lines: createMockReportNumbers({
				pct: 90,
			}),
		});
		const mockCompareReport = createMockCoverageReport({
			lines: createMockReportNumbers({
				pct: 90,
			}),
		});

		const summaryHtml = generateSummaryTableHtml(
			mockReport,
			undefined,
			mockCompareReport,
		);

		expect(getTableLine(1, summaryHtml)).toContain("90%<br/>🟰 <em>±0%</em>");
	});

	describe("thresholdIcons", () => {
		it("uses thresholdIcons icon when no vitest threshold is defined", async (): Promise<void> => {
			const thresholdIcons: ThresholdIcons = {
				0: "🔴",
				80: "🟠",
				90: "🟢",
			};
			const mockReport = createMockCoverageReport({
				lines: createMockReportNumbers({
					pct: 85,
				}),
			});

			const summaryHtml = generateSummaryTableHtml(
				mockReport,
				undefined,
				undefined,
				thresholdIcons,
			);

			expect(getTableLine(1, summaryHtml)).toContain("🟠");
		});

		it("uses red icon for low coverage based on thresholdIcons", async (): Promise<void> => {
			const thresholdIcons: ThresholdIcons = {
				0: "🔴",
				80: "🟠",
				90: "🟢",
			};
			const mockReport = createMockCoverageReport({
				lines: createMockReportNumbers({
					pct: 50,
				}),
			});

			const summaryHtml = generateSummaryTableHtml(
				mockReport,
				undefined,
				undefined,
				thresholdIcons,
			);

			expect(getTableLine(1, summaryHtml)).toContain("🔴");
		});

		it("uses green icon for high coverage based on thresholdIcons", async (): Promise<void> => {
			const thresholdIcons: ThresholdIcons = {
				0: "🔴",
				80: "🟠",
				90: "🟢",
			};
			const mockReport = createMockCoverageReport({
				lines: createMockReportNumbers({
					pct: 95,
				}),
			});

			const summaryHtml = generateSummaryTableHtml(
				mockReport,
				undefined,
				undefined,
				thresholdIcons,
			);

			expect(getTableLine(1, summaryHtml)).toContain("🟢");
		});

		it("falls back to blue if coverage is below all thresholds", async (): Promise<void> => {
			const thresholdIcons: ThresholdIcons = {
				50: "🟠",
				80: "🟢",
			};
			const mockReport = createMockCoverageReport({
				lines: createMockReportNumbers({
					pct: 30,
				}),
			});

			const summaryHtml = generateSummaryTableHtml(
				mockReport,
				undefined,
				undefined,
				thresholdIcons,
			);

			expect(getTableLine(1, summaryHtml)).toContain(icons.blue);
		});

		it("thresholdIcons takes precedence when both vitest threshold and thresholdIcons are provided", async (): Promise<void> => {
			const thresholds: Thresholds = { lines: 80 };
			const thresholdIcons: ThresholdIcons = {
				0: "❌",
				50: "⚠️",
				90: "✅",
			};
			const mockReport = createMockCoverageReport({
				lines: createMockReportNumbers({
					pct: 85,
				}),
			});

			const summaryHtml = generateSummaryTableHtml(
				mockReport,
				thresholds,
				undefined,
				thresholdIcons,
			);

			// thresholdIcons takes precedence - 85% matches the 50 threshold (⚠️)
			expect(getTableLine(1, summaryHtml)).toContain("⚠️");
			// But vitest threshold target should still be shown
			expect(getTableLine(1, summaryHtml)).toContain("🎯 80%");
		});

		it("uses exact threshold boundary correctly", async (): Promise<void> => {
			const thresholdIcons: ThresholdIcons = {
				0: "🔴",
				80: "🟢",
			};
			const mockReport = createMockCoverageReport({
				lines: createMockReportNumbers({
					pct: 80,
				}),
			});

			const summaryHtml = generateSummaryTableHtml(
				mockReport,
				undefined,
				undefined,
				thresholdIcons,
			);

			expect(getTableLine(1, summaryHtml)).toContain("🟢");
		});
	});
});
