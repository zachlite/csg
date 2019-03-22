import * as glMatrix from "gl-matrix";
const mat2 = glMatrix.mat2;
import * as _ from "lodash";

import { Polygon, Plane, Vertex, Edge } from "./interfaces";
import { getEdges } from "./getEdges";

export function splitPolygon(
  p: Polygon,
  plane: Plane
): { left: Polygon[]; right: Polygon[] } {
  const pointsOnPlane = p.filter(point => isOnPlane(point, plane));
  const polygonWithIntersections = _.uniqWith(
    _.flattenDepth(
      getEdges(p).map(edge => {
        const isIntersectCandidate =
          !pointsOnPlane.includes(edge[0]) && !pointsOnPlane.includes(edge[1]);

        if (!isIntersectCandidate) {
          return [edge];
        }

        const x = intersection(edge, plane);
        if (!x) return [edge];

        const intersectionInLineSegment =
          (x[0] < edge[0][0] && x[0] < edge[1][0]) ||
          (x[0] > edge[0][0] && x[0] > edge[1][0]);

        if (intersectionInLineSegment) return [edge];

        const e1 = [edge[0], x];
        const e2 = [x, edge[1]];
        return [e1, e2];
      }),
      2
    ),
    _.isEqual
  );

  // split left and right, preserving index
  const withIndices = polygonWithIntersections.map((point, i) => {
    return { point, i };
  });

  const leftVertices = withIndices.filter(point =>
    isLeftOfPlane(point.point, plane)
  );

  const rightVertices = withIndices.filter(point =>
    isRightOfPlane(point.point, plane)
  );

  if (!leftVertices.length) {
    return { left: [], right: [p] };
  }

  if (!rightVertices.length) {
    return { left: [p], right: [] };
  }

  const hasAdjacentPoint = (
    vertices,
    point: { point: [number, number]; i: number },
    totalVertices: number
  ) => {
    return vertices.find(vPoint => {
      return (
        Math.abs(vPoint.i - point.i) === 1 || point.i === totalVertices - 1
      );
    })
      ? true
      : false;
  };

  const onPlane = withIndices.filter(point => isOnPlane(point.point, plane));
  const inOriginalPolygon = (point: [number, number]) =>
    p.find(original => _.isEqual(original, point));

  const assignLeft = onPlane.filter(point => {
    return (
      inOriginalPolygon(point.point) &&
      hasAdjacentPoint(leftVertices, point, p.length)
    );
  });

  const assignRight = onPlane.filter(point => {
    return (
      inOriginalPolygon(point.point) &&
      hasAdjacentPoint(rightVertices, point, p.length)
    );
  });

  const newVertices = onPlane.filter(point => !inOriginalPolygon(point.point));

  const left = _.orderBy(
    [...leftVertices, ...assignLeft, ...newVertices],
    "i",
    "asc"
  );

  const right = _.orderBy(
    [...rightVertices, ...assignRight, ...newVertices],
    "i",
    "asc"
  );

  const leftPlanarEdges = getEdges(left.map(p => p.point)).filter(edge => {
    return isOnPlane(edge[0], plane) && isOnPlane(edge[1], plane);
  });

  if (planarEdgesOverlap(leftPlanarEdges)) {
    const expected = Math.floor((onPlane.length - 1) / 2);
    return {
      left: collectPolygons(expected, left),
      right: collectPolygons(1, right)
    };
  }

  const rightPlanarEdges = getEdges(right.map(p => p.point)).filter(edge => {
    return isOnPlane(edge[0], plane) && isOnPlane(edge[1], plane);
  });

  if (planarEdgesOverlap(rightPlanarEdges)) {
    const expected = Math.floor((onPlane.length - 1) / 2);
    return {
      left: collectPolygons(1, left),
      right: collectPolygons(expected, right)
    };
  }

  // both have 1
  return {
    left: collectPolygons(1, left),
    right: collectPolygons(1, right)
  };
}

// assume only the edges that are on the plane
function planarEdgesOverlap(edges: Edge[]): boolean {
  // the edge is overlapping if
  // there is another edge whose max y is greater than this edge's max y and min y is less than this edge's min y
  // or another edge whose max is is greater than this edge's max x and min x is less than this edge's min x

  for (let edge of edges) {
    const yMax = _.max([edge[0][1], edge[1][1]]);
    const yMin = _.min([edge[0][1], edge[1][1]]);
    const xMax = _.max([edge[0][0], edge[1][0]]);
    const xMin = _.min([edge[0][0], edge[1][0]]);

    for (let nextEdge of edges) {
      const yMaxNext = _.max([nextEdge[0][1], nextEdge[1][1]]);
      const yMinNext = _.min([nextEdge[0][1], nextEdge[1][1]]);
      const xMaxNext = _.max([nextEdge[0][0], nextEdge[1][0]]);
      const xMinNext = _.min([nextEdge[0][0], nextEdge[1][0]]);

      if (yMaxNext > yMax && yMinNext < yMin) return true;
      if (xMaxNext > xMax && xMinNext < xMin) return true;
    }
  }

  return false;
}

function collectPolygons(
  numExpected: number,
  vertices: { point: [number, number]; i: number }[]
): Polygon[] {
  const polygons = vertices.reduce(
    (acc, curr, i, src) => {
      if (i === 0) {
        return { ...acc, polygons: [[curr]] };
      }

      // does this vertex follow the previous vertex?
      if (curr.i === src[i - 1].i + 1) {
        let polygon = acc.polygons[acc.currPolygon];
        polygon.push(curr);
        return acc;
      }

      // if not, have we cycled through all there is to collect?
      if (acc.currPolygon === numExpected - 1) {
        acc.polygons[0].push(curr);
        acc.currPolygon = 0;
        return acc;
      }

      return {
        polygons: [...acc.polygons, [curr]],
        currPolygon: acc.currPolygon + 1
      };
    },
    { currPolygon: 0, polygons: [] }
  ).polygons;

  return polygons.map(polygon => {
    return polygon.map(p => p.point);
  });
}

function isLeftOfPlane(point: [number, number], plane: Plane) {
  return determinant(point, plane) < 0;
}

function isRightOfPlane(point: [number, number], plane: Plane) {
  return determinant(point, plane) > 0;
}

export function isOnPlane(point: [number, number], plane: Plane) {
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

function intersection(l1: [Vertex, Vertex], l2: [Vertex, Vertex]): Vertex {
  const slopeInterceptForm = (
    l: [Vertex, Vertex]
  ): { m: number; b: number } => {
    const dy = l[1][1] - l[0][1];
    const dx = l[1][0] - l[0][0];
    const m = dy / dx;
    const b = l[0][1] - m * l[0][0];
    return { m, b };
  };

  const l1_pif = slopeInterceptForm(l1);
  const l2_pif = slopeInterceptForm(l2);

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
