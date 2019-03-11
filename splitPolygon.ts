import * as glMatrix from "gl-matrix";
const mat2 = glMatrix.mat2;

import { Plane, Polygon, Vertex, Edge } from "./interfaces";

// give me a polygon, and a plane
// return a polygon, or undefined for each side of the plane
export function splitPolygon(
  p: Polygon,
  plane: Plane
): {
  left?: Polygon;
  right?: Polygon;
} {
  // if there are no vertices to the left, nothing to split
  // if there are no vertices to the right, nothing to split
  // if there are vertices on both sides, need to split
  // find where partition plane intersects the other planes

  const withIndices = p.map((point, i) => {
    return { point, i };
  });

  const leftVertices = withIndices.filter(point =>
    isLeftOfPlane(point.point, plane)
  );

  if (!leftVertices.length) {
    return { left: undefined, right: p };
  }

  const rightVertices = withIndices.filter(point =>
    isRightOfPlane(point.point, plane)
  );

  if (!rightVertices.length) {
    return { left: p, right: undefined };
  }

  // take vertices that lie on plane and assign them left or right
  // if a vertex is adjacent to a point that is left, -> left
  // if a vertex is adjacent to a point that is right -> right

  const pointsOnPlane = withIndices.filter(point =>
    isOnPlane(point.point, plane)
  );

  const hasAdjacentPoint = (vertices, point) => {
    return vertices.find(vPoint => {
      return Math.abs(vPoint.i - point.i) === 1;
    })
      ? true
      : false;
  };

  const assignLeft = pointsOnPlane.filter(point =>
    hasAdjacentPoint(leftVertices, point)
  );

  const assignRight = pointsOnPlane.filter(point =>
    hasAdjacentPoint(rightVertices, point)
  );

  /////

  // edges: pairs of adjacent vertices
  // bisect candidate: an edge that does not have a point that lies on the plane
  // find intersections between plane and bisect candidates
  const pointsOnPlaneNoIndex = pointsOnPlane.map(p => p.point);
  const intersectCandidates = getEdges(p).filter(edge => {
    // in order to be a candidate, the edge must not have a point that lies on the plane
    return (
      !pointsOnPlaneNoIndex.includes(edge[0]) &&
      !pointsOnPlaneNoIndex.includes(edge[1])
    );
  });

  // find intersections between intersect candidates and plane, if any

  const newVertices = intersectCandidates
    .map(l => {
      // undefined if there's no intersection
      // undefined if the interesection is not within the line segements' x bounds
      const x = intersection(l, plane);
      if (!x) return undefined;

      if (
        (x[0] < l[0][0] && x[0] < l[1][0]) ||
        (x[0] > l[0][0] && x[0] > l[1][0])
      )
        return undefined;

      return x;
    })
    .filter(i => i);

  const leftPolygon = [
    ...leftVertices.map(p => p.point),
    ...assignLeft.map(p => p.point),
    ...newVertices
  ];
  const rightPolygon = [
    ...rightVertices.map(p => p.point),
    ...assignRight.map(p => p.point),
    ...newVertices
  ];

  return {
    left: leftPolygon,
    right: rightPolygon
  };
}

function intersection(l1: [Vertex, Vertex], l2: [Vertex, Vertex]): Vertex {
  const pointInterceptForm = (
    l: [Vertex, Vertex]
  ): { m: number; b: number } => {
    const dy = l[1][1] - l[0][1];
    const dx = l[1][0] - l[0][0];
    const m = dy / dx;
    const b = l[0][1] - m * l[0][0];
    return { m, b };
  };

  const l1_pif = pointInterceptForm(l1);
  const l2_pif = pointInterceptForm(l2);

  // parallel lines don't intersect
  if (l1_pif.m === l2_pif.m) return undefined;

  if (Math.abs(l1_pif.m) === Infinity) {
    // l1 is vertical
    const x = l1[0][0];
    const y = l2_pif.m * x + l2_pif.b;
    return [x, y];
  } else if (Math.abs(l2_pif.m) === Infinity) {
    // l2 is vertical
    const x = l2[0][0];
    const y = l1_pif.m * x + l1_pif.b;
    return [x, y];
  } else {
    // neither is vertical
    const x = (l2_pif.b - l1_pif.b) / (l1_pif.m - l2_pif.m); // l1 = l2, solve for x
    const y = l1_pif.m * x + l1_pif.b; // y = mx + b
    return [x, y];
  }
}

function getEdges(p: Polygon): Edge[] {
  // an edge is two adjacent vertices
  const edges = p
    .map((point, i) => {
      return i !== p.length - 1 ? [point, p[i + 1]] : [point, p[0]];
    })
    .filter(x => x);

  return edges as Edge[];
}

function isLeftOfPlane(point: [number, number], plane: Plane) {
  return determinant(point, plane) < 0;
}

function isRightOfPlane(point: [number, number], plane: Plane) {
  return determinant(point, plane) > 0;
}

function isOnPlane(point: [number, number], plane: Plane) {
  return determinant(point, plane) === 0;
}

function determinant(point: [number, number], plane: Plane): number {
  return mat2.determinant(
    mat2.fromValues(
      plane[1][0] - plane[0][0],
      plane[1][1] - plane[0][1],
      point[0] - plane[0][0],
      point[1] - plane[0][1]
    )
  );
}

let poly: Polygon = [
  [0, 0],
  [5, 5],
  [5, 3],
  [8, 0],
  [9, 1],
  [9, -5],
  [0, -5],
  [6, -2],
  [0, 0]
];
let partition: Plane = [[5, 5], [5, 3]];
console.log(splitPolygon(poly, partition));
