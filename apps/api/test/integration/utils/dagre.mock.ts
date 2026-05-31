class Graph {
  private readonly nodes = new Map<string, Record<string, number>>();

  node(id: string): Record<string, number> | undefined {
    return this.nodes.get(id);
  }

  setDefaultEdgeLabel(): void {
    return undefined;
  }

  setEdge(): void {
    return undefined;
  }

  setGraph(): void {
    return undefined;
  }

  setNode(id: string, value: Record<string, number>): void {
    this.nodes.set(id, { ...value, x: 0, y: this.nodes.size * 100 });
  }
}

export const graphlib = { Graph };

export function layout(): void {
  return undefined;
}
