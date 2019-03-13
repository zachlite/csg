import { Polygon, Plane } from "../src/interfaces";
import { splitPolygon } from "../src/splitPolygon";

test("polygon that doesn't split", () => {
  const p1: Polygon = [[0, 0], [0, 5], [5, 0]];
  const plane1: Plane = [[0, 5], [0, 0]];
  expect(splitPolygon(p1, plane1)).toEqual({
    left: [],
    right: [p1]
  });
});

test("polygon that splits in two", () => {
  const p1: Polygon = [[0, 0], [5, 5], [5, 3], [8, 0]];
  const plane1: Plane = [[5, 5], [5, 3]];
  expect(splitPolygon(p1, plane1)).toEqual({
    left: [[[0, 0], [5, 5], [5, 0]]],
    right: [[[5, 3], [8, 0], [5, 0]]]
  });
});

test("polygon that splits in three", () => {
  const p1: Polygon = [
    [0, 0],
    [5, 5],
    [5, 3],
    [8, 0],
    [9, 1],
    [9, -5],
    [0, -5],
    [6, -2]
  ];

  const plane1: Plane = [[5, 5], [5, 3]];
  expect(splitPolygon(p1, plane1)).toEqual({
    left: [
      [[0, 0], [5, 5], [5, -1.6666666666666665]],
      [[5, -5], [0, -5], [5, -2.5]]
    ],
    right: [
      [
        [5, 3],
        [8, 0],
        [9, 1],
        [9, -5],
        [5, -5],
        [5, -2.5],
        [6, -2],
        [5, -1.6666666666666665]
      ]
    ]
  });
});
