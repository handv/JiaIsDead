import { describe, expect, it } from "vitest";
import batch1 from "../data/batch1.json";
import batch2 from "../data/batch2.json";
import batch3 from "../data/batch3.json";
import batch4 from "../data/batch4.json";
import batch5 from "../data/batch5.json";
import {
  LINE_CE,
  LINE_WIFE,
  clusterMid,
  groupEdges,
  lineColor,
  linePaths,
  parentKey,
  treeEdges,
} from "./treeLines.js";

const allSlots = [
  ...batch1.slots,
  ...batch2.slots,
  ...batch3.slots,
  ...batch4.slots,
  ...batch5.slots,
];

describe("treeEdges", () => {
  const edges = treeEdges(allSlots);

  it("drops spouses and keeps blood and skip-generation kin", () => {
    expect(edges.some((edge) => edge.to === "daishan-wife")).toBe(false);
    expect(edges.some((edge) => edge.to === "keqing-pending")).toBe(false);
    expect(edges).toContainEqual({ from: ["ning-gong"], to: "ning-dai", kind: "child" });
    expect(edges).toContainEqual({
      from: ["rong-dai", "daishan-wife"],
      to: "rong-wen-2",
      kind: "child",
    });
    expect(edges).toContainEqual({
      from: ["daishan-wife"],
      to: "jiamu-niece",
      kind: "child",
    });
    expect(edges).toContainEqual({ from: ["xue-sister"], to: "xue-niece", kind: "child" });
  });

  it("attaches both parents when the other is on the tree", () => {
    expect(edges).toContainEqual({
      from: ["rong-wen-3", "min-husband"],
      to: "min-daughter",
      kind: "child",
    });
    expect(edges).toContainEqual({
      from: ["rong-wen-2", "zheng-wife"],
      to: "zheng-son",
      kind: "child",
    });
    expect(edges).toContainEqual({
      from: ["rong-wen-2", "zhao-shi"],
      to: "zheng-yu-son-ce",
      kind: "child",
    });
  });

  it("hangs 贾赦's children from him alone, not 邢夫人", () => {
    expect(edges).toContainEqual({
      from: ["rong-wen-1"],
      to: "she-son",
      kind: "child",
    });
    expect(edges).toContainEqual({
      from: ["rong-wen-1"],
      to: "she-yu-girl",
      kind: "child",
    });
    expect(edges.some((edge) => edge.to === "she-son" && edge.from.includes("she-wife"))).toBe(
      false,
    );
    expect(edges.some((edge) => edge.to === "she-yu-girl" && edge.from.includes("she-wife"))).toBe(
      false,
    );
  });

  it("marks same-generation kin as side branches", () => {
    expect(edges.some((edge) => edge.to === "keqing-pending")).toBe(false);
    expect(edges).toContainEqual({ from: ["rong-wen-2"], to: "zhao-shi", kind: "side" });
  });
});

describe("clusterMid", () => {
  it("uses the outer edges, not the average of card centers", () => {
    expect(
      clusterMid([
        { x: 0, w: 100 },
        { x: 100, w: 300 },
      ]),
    ).toBe(200);
    expect(parentKey(["zheng-wife", "rong-wen-2"])).toBe("rong-wen-2+zheng-wife");
  });
});

describe("linePaths", () => {
  it("draws a T from the parent card, not the couple box", () => {
    const groups = groupEdges([
      { from: ["zheng"], to: "zhu", kind: "child" },
      { from: ["zheng"], to: "baoyu", kind: "child" },
    ]);
    const paths = linePaths(groups, {
      zheng: { x: 0, y: 0, w: 100, h: 40 },
      zhu: { x: 0, y: 80, w: 80, h: 40 },
      baoyu: { x: 120, y: 80, w: 80, h: 40 },
    });
    expect(paths).toHaveLength(1);
    expect(paths[0].d).toContain("M 50 40");
    expect(paths[0].d).toContain("L 160 60");
  });

  it("drops a line from each parent onto the same child rail", () => {
    const groups = groupEdges([
      { from: ["zheng", "wang"], to: "zhu", kind: "child" },
      { from: ["zheng", "wang"], to: "baoyu", kind: "child" },
    ]);
    const paths = linePaths(groups, {
      zheng: { x: 0, y: 0, w: 100, h: 40 },
      wang: { x: 100, y: 0, w: 100, h: 40 },
      zhu: { x: 0, y: 80, w: 80, h: 40 },
      baoyu: { x: 120, y: 80, w: 80, h: 40 },
    });
    expect(paths[0].d).toContain("M 50 40 L 50 52.8 L 100 52.8");
    expect(paths[0].d).toContain("M 150 40 L 150 52.8 L 100 52.8");
    expect(paths[0].d).toContain("M 100 52.8 L 100 60.8");
  });

  it("skips a side line when two cards already sit in one couple", () => {
    const groups = groupEdges([{ from: ["zheng"], to: "zhao", kind: "side" }]);
    const paths = linePaths(groups, {
      zheng: { x: 0, y: 0, w: 100, h: 40 },
      zhao: { x: 100, y: 0, w: 100, h: 40 },
    });
    expect(paths).toEqual([]);
  });

  it("uses one red for every branch", () => {
    expect(
      lineColor({ from: ["rong-wen-2", "zheng-wife"], kind: "child" }, allSlots),
    ).toBe(LINE_WIFE);
    expect(
      lineColor({ from: ["rong-wen-2", "zhao-shi"], kind: "child" }, allSlots),
    ).toBe(LINE_CE);
    expect(LINE_CE).toBe(LINE_WIFE);
  });

  it("uses an elbow for a skip-generation niece", () => {
    const groups = groupEdges([
      { from: ["jiamu"], to: "xiangyun", kind: "child" },
    ]);
    const paths = linePaths(groups, {
      jiamu: { x: 0, y: 0, w: 100, h: 40 },
      xiangyun: { x: 300, y: 200, w: 100, h: 40 },
    });
    expect(paths[0].d).toBe("M 100 20 L 350 20 L 350 200");
  });
});
