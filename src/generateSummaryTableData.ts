import { CoverageReport, JsonSummary, ReportNumbers } from './types/JsonSummary';
import { Thresholds } from './types/Threshold';
import core from '@actions/core';

type TableData = Parameters<typeof core.summary.addTable>[0];

const generateTableLine = ({ reportNumbers, category, threshold }: { reportNumbers: ReportNumbers; category: string; threshold?: number; }): string[] => {
  
  let status = ':large_blue_circle:';
  let percent = `${reportNumbers.pct}%`; 

  if(threshold) {
    status = reportNumbers.pct >= threshold ? ':white_check_mark:' : ':x:';
    percent = `${percent} / ${threshold}%`;
  }
  
  return [
    status,
    category,
    `${percent}`,
    `${reportNumbers.covered} / ${reportNumbers.total}`,
  ]
}


const generateSummaryTableData = (jsonReport: CoverageReport, thresholds: Thresholds = {}): TableData => {
  const tableData: TableData = [
    [
      { data: 'Status', header: true }, 
      { data: 'Category', header: true },
      { data: 'Percentage', header: true },
      { data: 'Covered / Total ', header: true }
    ],
    generateTableLine({ reportNumbers: jsonReport.lines, category: 'Lines', threshold: thresholds.lines }),
    generateTableLine({ reportNumbers: jsonReport.statements, category: 'Statements', threshold: thresholds.statements }),
    generateTableLine({ reportNumbers: jsonReport.functions, category: 'Functions',threshold: thresholds.functions  }),
    generateTableLine({ reportNumbers: jsonReport.branches, category: 'Branches', threshold: thresholds.branches }),
  ];
  
  return tableData;
}

export {
  generateSummaryTableData
};

export type {
  TableData
};
