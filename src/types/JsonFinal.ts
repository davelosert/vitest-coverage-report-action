type StatementMap = {
	[statementNumber: string]: {
		start: {
			line: number;
			column: number;
		};
		end: {
			line: number;
			column: number;
		};
	};
};

type StatementCoverage = {
	[statementNumber: string]: number;
};

type StatementCoverageReport = {
	statementMap: StatementMap;
	s: StatementCoverage;
};

type FileCoverageReport = StatementCoverageReport & {
	path: string;
	all: boolean;
};

type JsonFinal = {
	[path: string]: FileCoverageReport;
};

export type {
	JsonFinal,
	FileCoverageReport,
	StatementCoverageReport,
	StatementCoverage,
	StatementMap,
};
