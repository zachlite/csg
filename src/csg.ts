import * as _ from "lodash";
import { Polygon, Plane, BSPTreeNode } from "./interfaces";
import { splitPolygon, isOnPlane } from "./splitPolygon";
import { getEdges } from "./getEdges";

// const polygon: Polygon = [[0, 0], [1, 0], [1, 1]];
// const planes: Plane[] = [[[0, 0], [1, 0]], [[1, 0], [1, 1]], [[1, 1], [0, 0]]];
const polygon: Polygon = [[0, 0], [5, 3], [5, 5], [10, 0]];
const planes: Plane[] = [[[5, 3], [5, 5]]];

function buildBSPT(p: Polygon, planes: Plane[]): BSPTreeNode {
  const plane: Plane = planes[0]; // take the first splitting plane
  const unusedPlanes = planes.filter((x, i) => i > 0);

  const { left, right } = splitPolygon(p, plane);

  if ((right.length === 0 || left.length === 0) && unusedPlanes.length === 0) {
    return {
      plane,
      left: "in",
      right: "out"
    };
  }

  // when I get planes for a new split shape, I filter any that are on the same plane as the current split plane.
  const getNonPlanarEdges = (p: Polygon) =>
    getEdges(p).filter(
      edge => !isOnPlane(edge[0], plane) || !isOnPlane(edge[1], plane)
    );

  const leftPlanes =
    left.length > 0 && right.length > 0
      ? getNonPlanarEdges(left[0])
      : unusedPlanes;

  const rightPlanes =
    left.length > 0 && right.length > 0
      ? getNonPlanarEdges(right[0])
      : unusedPlanes;

  const l =
    left.length > 1
      ? mergeSubTrees(left, plane)
      : left.length === 1
      ? buildBSPT(left[0], leftPlanes)
      : "in";

  const r =
    right.length > 1
      ? mergeSubTrees(right, plane)
      : right.length === 1
      ? buildBSPT(right[0], rightPlanes)
      : "out";

  return {
    plane,
    left: l,
    right: r
  };
}

const mergeSubTrees = (polygons: Polygon[], plane) => {
  const trees = polygons.map(polygon => {
    const planes = [];
    return buildBSPT(polygon, planes);
  });

  const treeGroups = _.chunk(trees, 2);
  const treeNodes = treeGroups.map(group => {
    return {
      plane,
      left: group[0],
      right: group.length === 2 ? group[1] : "out"
    } as BSPTreeNode;
  });

  const tree = treeNodes.reduce((acc, curr) => {
    if (!acc) return curr;
    return {
      plane,
      left: acc,
      right: curr
    };
  }, undefined);

  return tree;
};

//
console.log(JSON.stringify(buildBSPT(polygon, planes)));
