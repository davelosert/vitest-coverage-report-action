import { CoverageReport, JsonSummary, ReportNumbers } from './types/JsonSummary';
import { Thresholds } from './types/Threshold';
import core from '@actions/core';
import { oneLine } from 'common-tags';
import { icons } from './icons';

type TableData = string;


const generateTableRow = ({ reportNumbers, category, threshold }: { reportNumbers: ReportNumbers; category: string; threshold?: number; }): string => {
  
  let status = icons.blue;
  let percent = `${reportNumbers.pct}%`; 

  if(threshold) {
    status = reportNumbers.pct >= threshold ? icons.green : icons.red;
    percent = `${percent} / ${threshold}%`;
  }
  
  return `
    <td align="center">${status}</td>
    <td align="left">${category}</td>
    <td align="right">${percent}</td>
    <td align="right">${reportNumbers.covered} / ${reportNumbers.total}</td>
  `
}


const generateSummaryTableData = (jsonReport: CoverageReport, thresholds: Thresholds = {}): TableData => {
  return oneLine`
    <table>
      <thead>
        <tr>
         <th align="center">Status</th>
         <th align="left">Category</th>
         <th align="right">Percentage</th>
         <th align="right">Covered / Total</th>
         <th align="left">Uncovered Lines</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          ${generateTableRow({ reportNumbers: jsonReport.lines, category: 'Lines', threshold: thresholds.lines })}
        </tr>
        <tr>
          ${generateTableRow({ reportNumbers: jsonReport.statements, category: 'Statements', threshold: thresholds.statements })}
        </tr>
        <tr>
          ${generateTableRow({ reportNumbers: jsonReport.functions, category: 'Functions',threshold: thresholds.functions  })}
        </tr>
        <tr>
          ${generateTableRow({ reportNumbers: jsonReport.branches, category: 'Branches', threshold: thresholds.branches })}
        </tr>
      </tbody>
    </table>
  `

}

export {
  generateSummaryTableData,
  generateTableRow
};

export type {
  TableData
};
