import * as _ from "lodash";
import * as glMatrix from "gl-matrix";
import { Polygon, Plane, BSPTreeNode } from "./interfaces";
const mat2 = glMatrix.mat2;

const polygon: Polygon = [[0, 0], [1, 0], [1, 1]];

const planes: Plane[] = [
  [polygon[0], polygon[1]],
  [polygon[1], polygon[2]],
  [polygon[0], polygon[2]]
];

function triangleCentroid(a: number[], b: number[], c: number[]) {
  const x = (a[0] + b[0] + c[0]) / 3;
  const y = (a[1] + b[1] + c[1]) / 3;
  return [x, y];
}

function buildBSPT(p: Polygon, planes: Plane[]): BSPTreeNode {
  const plane: Plane = planes[0]; // take the first splitting plane
  const unusedPlanes = planes.filter((x, i) => i > 0);

  const partition = (p: Polygon, predicate: (d: number) => boolean) => {
    // take the center point of face as the test point
    const faceCenter = triangleCentroid(p[0], p[1], p[2]);

    // compute the determinant of the matrix whose columns are:
    const determinant = mat2.determinant(
      mat2.fromValues(
        plane[1][0] - plane[0][0],
        plane[1][1] - plane[0][1],
        faceCenter[0] - plane[0][0],
        faceCenter[1] - plane[0][1]
      )
    );

    // test against predicate
    return predicate(determinant);
  };

  const left = partition(p, d => d > 0) ? p : null;
  const right = partition(p, d => d < 0) ? p : null;

  if ((!left && !right) || unusedPlanes.length === 0)
    return {
      plane,
      left: "in",
      right: "out"
    };

  if (!left && right)
    return {
      plane,
      left: "in",
      right: buildBSPT(right, unusedPlanes)
    };

  if (left && !right)
    return {
      plane,
      left: buildBSPT(left, unusedPlanes),
      right: "out"
    };

  // when both left and right,
  // that means the polygon was bisected
  // left and right buildBSPT calls need fresh plane lists for left and right
  return {
    plane,
    left: buildBSPT(left, []),
    right: buildBSPT(right, [])
  };
}

//
console.log(JSON.stringify(buildBSPT(polygon, planes)));
