import { describe, expect, it } from "vitest";
import {
  buildVerdict,
  closedLine,
  familiarityTitle,
  houseGroup,
  paperScore,
  PAPER_TOTAL,
  reviseScore,
  searchScore,
  weaknessLine,
} from "./familiarity.js";

describe("searchScore", () => {
  it("is full at 34 searches and drops two points each extra", () => {
    expect(searchScore(34)).toBe(100);
    expect(searchScore(20)).toBe(100);
    expect(searchScore(35)).toBe(98);
  });
});

describe("paperScore", () => {
  it("scales opened scraps against the full dossier", () => {
    expect(paperScore(PAPER_TOTAL, PAPER_TOTAL)).toBe(100);
    expect(paperScore(0, PAPER_TOTAL)).toBe(0);
  });
});

describe("reviseScore", () => {
  it("loses four points per rewrite", () => {
    expect(reviseScore(0)).toBe(100);
    expect(reviseScore(2)).toBe(92);
  });
});

describe("familiarityTitle", () => {
  it("uses the four fixed ranks", () => {
    expect(familiarityTitle(96)).toBe("冷子兴同席");
    expect(familiarityTitle(78)).toBe("谱系清楚");
    expect(familiarityTitle(60)).toBe("看过戏文");
    expect(familiarityTitle(55)).toBe("护官符刚背完");
  });
});

describe("weaknessLine", () => {
  it("names only a clear house lead", () => {
    expect(weaknessLine({ ning: 6, rong: 1, kin: 0 })).toBe("宁府靠蒙");
    expect(weaknessLine({ ning: 2, rong: 2, kin: 1 })).toBe("");
    expect(weaknessLine({ ning: 3, rong: 2, kin: 0 })).toBe("");
    expect(weaknessLine({})).toBe("");
  });
});

describe("houseGroup", () => {
  it("folds wang into Rong and lin/shi/xue into kin", () => {
    expect(houseGroup("ning")).toBe("ning");
    expect(houseGroup("wang")).toBe("rong");
    expect(houseGroup("xue")).toBe("kin");
  });
});

describe("buildVerdict", () => {
  it("clamps a clean run below 100 and snapshots the counts", () => {
    const verdict = buildVerdict({
      searchCount: 34,
      reviseCount: 0,
      paperCount: PAPER_TOTAL,
      reviseByHouse: { ning: 0, rong: 0, kin: 0 },
    });
    expect(verdict.familiarity).toBe(96);
    expect(verdict.title).toBe("冷子兴同席");
    expect(verdict.weakness).toBe("");
    expect(verdict.searchCount).toBe(34);
    expect(verdict.paperCount).toBe(PAPER_TOTAL);
    expect(verdict.paperTotal).toBe(PAPER_TOTAL);
  });

  it("stays at least 55 after a messy run", () => {
    const verdict = buildVerdict({
      searchCount: 120,
      reviseCount: 40,
      paperCount: 2,
      reviseByHouse: { ning: 1, rong: 8, kin: 1 },
    });
    expect(verdict.familiarity).toBe(55);
    expect(verdict.title).toBe("护官符刚背完");
    expect(verdict.weakness).toBe("荣府靠蒙");
  });

  it("is deterministic", () => {
    const input = { searchCount: 50, reviseCount: 3, paperCount: 20 };
    expect(buildVerdict(input)).toEqual(buildVerdict(input));
  });
});

describe("closedLine", () => {
  it("prints the share sentence", () => {
    expect(closedLine({ familiarity: 78 })).toBe("你对红楼梦的熟悉度 78%。");
  });
});
