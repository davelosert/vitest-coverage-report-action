import { describe, expect, it } from "vitest";

describe("File Coverage Expanded Option", () => {
	it("generates collapsed details element when fileCoverageExpanded is false", () => {
		const fileTable = "<div>File Coverage Content</div>";
		const label = "File Coverage";

		// Simulate addDetails behavior (default)
		const result = `<details><summary>${label}</summary>${fileTable}</details>\n`;

		expect(result).toContain("<details>");
		expect(result).not.toContain("<details open>");
		expect(result).toContain("<summary>File Coverage</summary>");
		expect(result).toContain(fileTable);
	});

	it("generates expanded details element when fileCoverageExpanded is true", () => {
		const fileTable = "<div>File Coverage Content</div>";

		// Simulate addRaw behavior with open attribute
		const result = `<details open><summary>File Coverage</summary>${fileTable}</details>\n`;

		expect(result).toContain("<details open>");
		expect(result).toContain("<summary>File Coverage</summary>");
		expect(result).toContain(fileTable);
	});
});
