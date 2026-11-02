export interface DiagnosticIssue {
  filePath: string;
  line: number;
  severity: "Critical" | "High" | "Medium" | "Cosmetic";
  description: string;
}

export interface PriorityReport {
  critical: DiagnosticIssue[];
  high: DiagnosticIssue[];
  medium: DiagnosticIssue[];
  cosmetic: DiagnosticIssue[];
  recommendedFixOrder: string[];
}

const WEIGHT: Record<string, number> = { Critical: 100, High: 40, Medium: 10, Cosmetic: 0 };

export function planRepairs(issues: DiagnosticIssue[]): PriorityReport {
  const report: PriorityReport = {
    critical: [],
    high: [],
    medium: [],
    cosmetic: [],
    recommendedFixOrder: [],
  };

  for (const issue of issues) {
    if (issue.severity === "Critical") report.critical.push(issue);
    else if (issue.severity === "High") report.high.push(issue);
    else if (issue.severity === "Medium") report.medium.push(issue);
    else report.cosmetic.push(issue);
  }

  // Weight priority files (Critical first, then High, then Medium).
  const fileWeight = new Map<string, number>();
  for (const issue of issues) {
    fileWeight.set(issue.filePath, (fileWeight.get(issue.filePath) || 0) + WEIGHT[issue.severity]);
  }
  report.recommendedFixOrder = Array.from(fileWeight.entries())
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0]);

  return report;
}
