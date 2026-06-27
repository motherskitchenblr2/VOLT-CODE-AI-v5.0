export interface GraphNode {
  id: string; // File path or dependency name
  type: 'component' | 'hook' | 'service' | 'api' | 'database' | 'dependency';
  dependencies: string[];
}

export interface HealthScoreDetails {
  totalScore: number;
  lintWarnings: number;
  complexityPenalty: number;
  circularCyclesCount: number;
  testPassRate: number;
}

export class RepoIntelligence {
  private graph: Map<string, GraphNode> = new Map();

  // Multi-layered Knowledge Graph Registry (Gap 9)
  public buildKnowledgeGraph(files: { path: string; content: string }[], dependenciesList: string[]) {
    this.graph.clear();

    // 1. Registry dependencies first
    for (const dep of dependenciesList) {
      this.graph.set(`dep:${dep}`, { id: dep, type: 'dependency', dependencies: [] });
    }

    for (const file of files) {
      const id = file.path;
      let type: GraphNode['type'] = 'component';
      
      if (id.includes('/hooks/')) type = 'hook';
      else if (id.includes('/services/')) type = 'service';
      else if (id.includes('/api/')) type = 'api';
      else if (id.includes('/models/')) type = 'database';

      const foundDeps: string[] = [];
      const lines = file.content.split('\n');

      for (const line of lines) {
        // Detect component/hook imports
        const match = line.match(/import\s+.*\s+from\s+['"](.*)['"]/);
        if (match) {
          const path = match[1];
          if (path.startsWith('.')) {
            foundDeps.push(path);
          } else {
            foundDeps.push(`dep:${path}`);
          }
        }
      }

      this.graph.set(id, { id, type, dependencies: foundDeps });
    }
  }

  // Repository Health Engine (Gap 8)
  public calculateHealthScore(
    filesCount: number,
    lintWarnings: number,
    testPassRate: number, // 0 to 100
    circularCyclesCount: number
  ): HealthScoreDetails {
    let totalScore = 100;

    // Penalty metrics
    const lintPenalty = Math.min(lintWarnings * 0.5, 20); // Max 20 penalty points
    const circularPenalty = Math.min(circularCyclesCount * 5, 25); // Max 25 penalty points
    const testPenalty = (100 - testPassRate) * 0.5; // Max 50 penalty points

    totalScore = Math.max(0, totalScore - lintPenalty - circularPenalty - testPenalty);

    return {
      totalScore: Math.round(totalScore),
      lintWarnings,
      complexityPenalty: Math.round(lintPenalty),
      circularCyclesCount,
      testPassRate
    };
  }

  public getDownstreamImpact(nodeId: string): string[] {
    const impacts: string[] = [];
    const visited = new Set<string>();

    const traverse = (current: string) => {
      visited.add(current);
      for (const [key, node] of this.graph.entries()) {
        if (node.dependencies.includes(current) && !visited.has(key)) {
          impacts.push(key);
          traverse(key);
        }
      }
    };

    traverse(nodeId);
    return impacts;
  }

  public getComponentGraph() {
    return Array.from(this.graph.values());
  }

  public detectCircularDependencies(): string[][] {
    const list: string[][] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (nodeId: string, path: string[]) => {
      visited.add(nodeId);
      stack.add(nodeId);

      const node = this.graph.get(nodeId);
      if (node) {
        for (const imp of node.dependencies) {
          const resolvedPath = this.resolvePath(nodeId, imp);
          if (resolvedPath && this.graph.has(resolvedPath)) {
            if (stack.has(resolvedPath)) {
              const cycleStartIdx = path.indexOf(resolvedPath);
              list.push([...path.slice(cycleStartIdx), nodeId, resolvedPath]);
            } else if (!visited.has(resolvedPath)) {
              dfs(resolvedPath, [...path, resolvedPath]);
            }
          }
        }
      }

      stack.delete(nodeId);
    };

    for (const key of this.graph.keys()) {
      if (!visited.has(key)) {
        dfs(key, [key]);
      }
    }

    return list;
  }

  private resolvePath(currentFile: string, importPath: string): string | null {
    if (!importPath.startsWith('.')) return null; // Ignore node_modules
    const parts = currentFile.split('/');
    parts.pop(); // Remove file name
    const impParts = importPath.split('/');
    
    for (const part of impParts) {
      if (part === '.') continue;
      if (part === '..') parts.pop();
      else parts.push(part);
    }

    let finalPath = parts.join('/');
    if (!finalPath.endsWith('.ts') && !finalPath.endsWith('.tsx')) {
      finalPath += '.tsx'; // Default fallback extension
    }
    return finalPath;
  }
}
