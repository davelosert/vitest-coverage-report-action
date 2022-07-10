import { icons } from './icons';
import { oneLine } from 'common-tags';
import { Thresholds } from './types/Threshold';
import { CoverageReport, ReportNumbers } from './types/JsonSummary';

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


const generateSummaryTableHtml = (jsonReport: CoverageReport, thresholds: Thresholds = {}): string => {
  return oneLine`
    <table>
      <thead>
        <tr>
         <th align="center">Status</th>
         <th align="left">Category</th>
         <th align="right">Percentage</th>
         <th align="right">Covered / Total</th>
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
  generateSummaryTableHtml
};
