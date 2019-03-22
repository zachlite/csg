import { Polygon, Edge } from "./interfaces";

export function getEdges(p: Polygon): Edge[] {
  // an edge is two adjacent vertices
  const edges = p
    .map((point, i) => {
      return i !== p.length - 1 ? [point, p[i + 1]] : [point, p[0]];
    })
    .filter(x => x);

  return edges as Edge[];
}
