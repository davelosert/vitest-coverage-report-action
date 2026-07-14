import { describe, expect, it } from "vitest";
import { getTableLine } from "../../test/queryHelper";
import { defaultThresholdIcons, icons } from "../icons";
import {
	createMockCoverageReport,
	createMockReportNumbers,
} from "../types/JsonSummaryMockFactory";
import type { Thresholds } from "../types/Threshold";
import type {
	ThresholdIcons,
	ThresholdIconsByCategory,
} from "../types/ThresholdIcons";
import { generateSummaryTableHtml } from "./generateSummaryTableHtml";

/** Applies the same ThresholdIcons map to every category, for tests that only inspect the "Lines" row. */
function everyCategory(
	thresholdIcons: ThresholdIcons,
): ThresholdIconsByCategory {
	return {
		lines: thresholdIcons,
		statements: thresholdIcons,
		functions: thresholdIcons,
		branches: thresholdIcons,
	};
}

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

	it("renders the icon from the resolved per-category thresholdIcons, ignoring the raw threshold.", async (): Promise<void> => {
		// precedence logic lives in resolveThresholdIcons.test.ts now
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
			everyCategory(defaultThresholdIcons),
		);

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

	it("shows a threshold target when the threshold is 0.", async (): Promise<void> => {
		const thresholds: Thresholds = { lines: 0 };
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

		expect(getTableLine(1, summaryHtml)).toContain("80% (🎯 0%)");
	});

	it("does not show a threshold target when the threshold is null.", async (): Promise<void> => {
		const thresholds = { lines: null } as unknown as Thresholds;
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

		expect(getTableLine(1, summaryHtml)).toContain("80%");
		expect(getTableLine(1, summaryHtml)).not.toContain(icons.target);
	});

	it("does not show a threshold target when the threshold is undefined.", async (): Promise<void> => {
		const thresholds = { lines: undefined } as Thresholds;
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

		expect(getTableLine(1, summaryHtml)).toContain("80%");
		expect(getTableLine(1, summaryHtml)).not.toContain(icons.target);
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
				everyCategory(thresholdIcons),
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
				everyCategory(thresholdIcons),
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
				everyCategory(thresholdIcons),
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
				everyCategory(thresholdIcons),
			);

			expect(getTableLine(1, summaryHtml)).toContain(icons.blue);
		});

		it("renders the given thresholdIcons even when a vitest threshold is also defined (target % still shown)", async (): Promise<void> => {
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
				everyCategory(thresholdIcons),
			);

			// 85% matches the 50 threshold (⚠️)
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
				everyCategory(thresholdIcons),
			);

			expect(getTableLine(1, summaryHtml)).toContain("🟢");
		});
	});

	describe("comparisonDecimalPlaces", () => {
		it("uses custom decimal places for comparison percentages", async (): Promise<void> => {
			const mockReport = createMockCoverageReport({
				lines: createMockReportNumbers({
					pct: 80.12345,
				}),
			});
			const mockCompareReport = createMockCoverageReport({
				lines: createMockReportNumbers({
					pct: 70,
				}),
			});

			const summaryHtml = generateSummaryTableHtml(
				mockReport,
				undefined,
				mockCompareReport,
				everyCategory(defaultThresholdIcons),
				4, // custom decimal places
			);

			expect(getTableLine(1, summaryHtml)).toContain("+10.1235%");
		});

		it("defaults to 2 decimal places when not specified", async (): Promise<void> => {
			const mockReport = createMockCoverageReport({
				lines: createMockReportNumbers({
					pct: 80.12345,
				}),
			});
			const mockCompareReport = createMockCoverageReport({
				lines: createMockReportNumbers({
					pct: 70,
				}),
			});

			const summaryHtml = generateSummaryTableHtml(
				mockReport,
				undefined,
				mockCompareReport,
			);

			expect(getTableLine(1, summaryHtml)).toContain("+10.12%");
		});
	});
});
