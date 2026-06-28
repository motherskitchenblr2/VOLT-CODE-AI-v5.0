export interface DiagnosticIssue {
  filePath: string;
  line: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Cosmetic';
  description: string;
}

export interface PriorityReport {
  critical: DiagnosticIssue[];
  high: DiagnosticIssue[];
  medium: DiagnosticIssue[];
  cosmetic: DiagnosticIssue[];
  recommendedFixOrder: string[]; // Order of files to patch
}

export class RepairPlanner {
  public static planRepairs(issues: DiagnosticIssue[]): PriorityReport {
    const report: PriorityReport = {
      critical: [],
      high: [],
      medium: [],
      cosmetic: [],
      recommendedFixOrder: []
    };

    // Classify by severity levels
    for (const issue of issues) {
      if (issue.severity === 'Critical') report.critical.push(issue);
      else if (issue.severity === 'High') report.high.push(issue);
      else if (issue.severity === 'Medium') report.medium.push(issue);
      else report.cosmetic.push(issue);
    }

    // Weight priority files (Critical first, then High, then Medium)
    const filePriorityWeight = new Map<string, number>();

    const calculateWeight = (fileIssues: DiagnosticIssue[]) => {
      for (const issue of fileIssues) {
        const current = filePriorityWeight.get(issue.filePath) || 0;
        const multiplier = issue.severity === 'Critical' ? 100 : issue.severity === 'High' ? 40 : 10;
        filePriorityWeight.set(issue.filePath, current + multiplier);
      }
    };

    calculateWeight(report.critical);
    calculateWeight(report.high);
    calculateWeight(report.medium);

    // Sort files based on accumulated weights
    report.recommendedFixOrder = Array.from(filePriorityWeight.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    return report;
  }
}
