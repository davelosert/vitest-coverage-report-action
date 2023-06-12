import { createJsonFinalEntry } from './types/JsonFinalMockFactory';
import { generateFileCoverageHtml } from './generateFileCoverageHtml';
import { getTableLine } from '../test/queryHelper';
import { JsonFinal } from './types/JsonFinal';
import { JsonSummary } from './types/JsonSummary';
import { createMockCoverageReport, createMockJsonSummary, createMockReportNumbers } from './types/JsonSummaryMockFactory';
import { describe, it, expect } from 'vitest';
import { FileCoverageMode } from './FileCoverageMode';
import * as path from 'path';

const workspacePath = process.cwd();
describe('generateFileCoverageHtml()', () => {
	it('renderes only the unchanged files if no changed files exist.', () => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			'src/generateFileCoverageHtml.ts': createMockCoverageReport(),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: []
		});

		const firstTableLine = getTableLine(1, html);

		expect(firstTableLine).toContain('Unchanged Files');
	});

	it('renders changed files before unchanged files.', () => {
		const relativeChangedFilePath = 'src/changedFile.ts'
		const jsonSummary: JsonSummary = createMockJsonSummary({
			'src/unchangedFile.ts': createMockCoverageReport(),
			[path.join(workspacePath, 'src', 'changedFile.ts')]: createMockCoverageReport(),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: [relativeChangedFilePath]
		});

		expect(getTableLine(1, html)).toContain('Changed Files');
		expect(getTableLine(2, html)).toContain(relativeChangedFilePath);
		expect(getTableLine(3, html)).toContain('Unchanged Files');
		expect(getTableLine(4, html)).toContain('src/unchangedFile.ts');
	});
	
	it('only renders unchanged files if the fileCoverageMode is set to All but only unchanged files exist.', () => {
		const changedFileName = 'src/changedFile.ts'
		const jsonSummary: JsonSummary = createMockJsonSummary({
			[changedFileName]: createMockCoverageReport(),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: [changedFileName]
		});

		expect(html).not.toContain('Unchanged Files');
	});
	
	it('renders statement that no changed files were found if the fileCoverageMode is set to Changed but no changed files exist.', () => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			'src/unchangedFile.ts': createMockCoverageReport(),
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.Changes,
			pullChanges: []
		});

		expect(html).toContain('No changed files found.');
	});
	
	it('renders the statements, branches, functions and line coverage-percentage of a file.', () => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			'src/generateFileCoverageHtml.ts': {
				statements: createMockReportNumbers({ pct: 70, }),
				branches: createMockReportNumbers({ pct: 80, }),
				functions: createMockReportNumbers({ pct: 90, }),
				lines: createMockReportNumbers({ pct: 100, }),
			},
		});

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonFinal: {},
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: []
		});

		const firstTableLine = getTableLine(2, html);

		expect(firstTableLine).toContain('70%');
		expect(firstTableLine).toContain('80%');
		expect(firstTableLine).toContain('90%');
		expect(firstTableLine).toContain('100%');
	});

	it('renders the line-coverage in the same row as the coverage.', async (): Promise<void> => {
		const jsonSummary: JsonSummary = createMockJsonSummary({
			'src/exampleFile.ts': createMockCoverageReport({
				statements: createMockReportNumbers({ pct: 70, }),
			}),
		});
		const jsonFinal: JsonFinal = {
			...createJsonFinalEntry('src/exampleFile.ts', [
				{ line: 1, covered: false },
				{ line: 2, covered: false }
			]),
		};

		const html = generateFileCoverageHtml({
			jsonSummary,
			jsonFinal,
			fileCoverageMode: FileCoverageMode.All,
			pullChanges: []
		});

		const firstTableLine = getTableLine(2, html);
		
		expect(firstTableLine).toContain('70%');
		expect(firstTableLine).toContain('1-2');
	});
});
