import { JsonSummary, ReportNumbers } from './types/JsonSummary';
import { Thresholds } from './types/Threshold';

const generateTableLine = ({ reportNumbers, category, threshold }: { reportNumbers: ReportNumbers; category: string; threshold?: number; }): string[] => {
  
  let status = ':large_blue_circle:';
  if(threshold) {
    status = reportNumbers.pct >= threshold ? ':white_check_mark:' : ':x:';
  }
  
  return [
    status,
    category,
    `${reportNumbers.pct}%`,
    `${reportNumbers.covered} / ${reportNumbers.total}`,
  ]
}

const generateTableFrom = (jsonReport: JsonSummary, thresholds: Thresholds = {}): string[][] => {
  const tableData = [
    ['Status', 'Category', 'Percentage', 'Covered / Total'],
    generateTableLine({ reportNumbers: jsonReport.total.lines, category: 'Lines', threshold: thresholds.lines }),
    generateTableLine({ reportNumbers: jsonReport.total.statements, category: 'Statements', threshold: thresholds.statements }),
    generateTableLine({ reportNumbers: jsonReport.total.functions, category: 'Functions',threshold: thresholds.functions  }),
    generateTableLine({ reportNumbers: jsonReport.total.branches, category: 'Branches', threshold: thresholds.branches }),
  ];
  return tableData;
}

export {
  generateTableFrom
};
