export type Vertex = [number, number];
export interface Polygon extends Array<Vertex> {}

export interface BSPTreeNode {
  plane: any;
  left: "in" | "out" | BSPTreeNode;
  right: "in" | "out" | BSPTreeNode;
}

export type Edge = [Vertex, Vertex];
export type Plane = [Vertex, Vertex];
