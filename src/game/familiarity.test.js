import { describe, expect, it } from "vitest";
import {
  buildVerdict,
  closedLine,
  houseGroup,
  PAPER_TOTAL,
  pickComments,
  rankOf,
  paperScore,
  reviseScore,
  searchScore,
  stampHouse,
} from "./familiarity.js";

describe("searchScore", () => {
  it("gives a free allowance of names plus opened papers", () => {
    expect(searchScore(34, 0)).toBe(100);
    expect(searchScore(20, 0)).toBe(100);
    expect(searchScore(74, 40)).toBe(100);
    expect(searchScore(75, 40)).toBe(99);
  });
});

describe("paperScore", () => {
  it("scales opened scraps against the full dossier", () => {
    expect(paperScore(PAPER_TOTAL, PAPER_TOTAL)).toBe(100);
    expect(paperScore(0, PAPER_TOTAL)).toBe(0);
  });
});

describe("reviseScore", () => {
  it("forgives the first four rewrites then drops four points each", () => {
    expect(reviseScore(0)).toBe(100);
    expect(reviseScore(4)).toBe(100);
    expect(reviseScore(5)).toBe(96);
  });
});

describe("rankOf", () => {
  it("uses five offices, gates 指挥佥事, and keeps 小旗 for heavy guessing", () => {
    expect(rankOf(95, { paperCount: 40, reviseCount: 0 })).toBe("指挥佥事");
    expect(rankOf(95, { paperCount: 35, reviseCount: 0 })).toBe("千户");
    expect(rankOf(95, { paperCount: 40, reviseCount: 11 })).toBe("千户");
    expect(rankOf(80)).toBe("千户");
    expect(rankOf(70)).toBe("百户");
    expect(rankOf(50)).toBe("总旗");
    expect(rankOf(20)).toBe("小旗");
    expect(rankOf(80, { paperCount: 40, reviseCount: 30 })).toBe("千户");
    expect(rankOf(80, { paperCount: 40, reviseCount: 80 })).toBe("小旗");
  });
});

describe("house stamps", () => {
  it("keeps kin together for grouping and splits them for朱批", () => {
    expect(houseGroup("ning")).toBe("ning");
    expect(houseGroup("wang")).toBe("rong");
    expect(houseGroup("xue")).toBe("kin");
    expect(stampHouse("xue")).toBe("xue");
    expect(stampHouse("wang")).toBe("rong");
  });
});

describe("pickComments", () => {
  const base = {
    score: 80,
    rank: "千户",
    paperCount: 40,
    paperTotal: PAPER_TOTAL,
    reviseCount: 6,
    searchExtra: 0,
    houses: {
      ning: 0,
      rong: 0,
      lin: 0,
      shi: 0,
      xue: 0,
      kinSplit: 0,
      kin: 0,
    },
    person: 0,
    role: 0,
  };

  it("pairs reading the dossier with a Ning rewrite roast", () => {
    const notes = pickComments({
      ...base,
      reviseCount: 7,
      houses: { ...base.houses, ning: 6, rong: 1 },
    });
    expect(notes.praise).toBe("姻亲不曾认成贾姓，已属难得。");
    expect(notes.roast).toBe("宁府这一支，像是听焦大喝醉了填的。");
  });

  it("pairs a clean fill with unread papers", () => {
    const notes = pickComments({
      ...base,
      score: 60,
      rank: "总旗",
      paperCount: 8,
      reviseCount: 0,
      searchExtra: 0,
    });
    expect(notes.praise).toBe("一气呵成，此谱无涂乙。");
    expect(notes.roast).toBe("残档束之高阁，全凭肚里那点戏文。");
  });

  it("does not call a messy Ning case 清楚", () => {
    const notes = pickComments({
      ...base,
      score: 92,
      rank: "指挥佥事",
      paperCount: 40,
      reviseCount: 3,
      houses: { ...base.houses, ning: 3, rong: 0 },
    });
    expect(notes.praise).not.toMatch(/此案清楚/);
    expect(notes.roast).toBe("宁府这一支，像是听焦大喝醉了填的。");
  });

  it("uses a light roast when the case is actually clean", () => {
    const notes = pickComments({
      ...base,
      score: 96,
      rank: "指挥佥事",
      paperCount: 40,
      reviseCount: 0,
      searchExtra: 0,
    });
    expect(notes.praise).toBe("此案清楚，不须冷子兴再说一遍。");
    expect(notes.roast).toBe("只是未免太熟。不像头一回抄家。");
  });
});

describe("buildVerdict", () => {
  it("awards 指挥佥事 for a clean full-dossier run", () => {
    const verdict = buildVerdict({
      searchCount: 34,
      reviseCount: 0,
      paperCount: PAPER_TOTAL,
      reviseByHouse: { ning: 0, rong: 0, lin: 0, shi: 0, xue: 0 },
    });
    expect(verdict.familiarity).toBe(100);
    expect(verdict.title).toBe("指挥佥事");
    expect(verdict.praise).toBe("此案清楚，不须冷子兴再说一遍。");
    expect(verdict.roast).toBe("只是未免太熟。不像头一回抄家。");
    expect(verdict.searchCount).toBe(34);
    expect(verdict.paperCount).toBe(PAPER_TOTAL);
    expect(verdict.paperTotal).toBe(PAPER_TOTAL);
  });

  it("keeps a messy unread run at 小旗", () => {
    const verdict = buildVerdict({
      searchCount: 120,
      reviseCount: 40,
      paperCount: 2,
      reviseByHouse: { ning: 1, rong: 8, kin: 1 },
    });
    expect(verdict.title).toBe("小旗");
    expect(verdict.roast).toBe("荣府人丁，对着护官符蒙的。");
    expect(verdict.praise).toBe("姻亲不曾认成贾姓，已属难得。");
  });

  it("gives a typical full-dossier run at least 百户, not 小旗", () => {
    const verdict = buildVerdict({
      searchCount: 80,
      reviseCount: 25,
      paperCount: PAPER_TOTAL,
      reviseByHouse: { ning: 8, rong: 7, lin: 2, shi: 1, xue: 2 },
    });
    expect(["百户", "千户", "指挥佥事"]).toContain(verdict.title);
    expect(verdict.title).not.toBe("小旗");
    expect(verdict.roast).toBe("宁府这一支，像是听焦大喝醉了填的。");
    expect(verdict.praise).toBe("办案的纸没少。格上却有涂乙。");
  });

  it("keeps 小旗 for a full dossier guessed slot by slot", () => {
    const verdict = buildVerdict({
      searchCount: 80,
      reviseCount: 80,
      paperCount: PAPER_TOTAL,
      reviseByHouse: { ning: 2, rong: 2, lin: 11, shi: 11, xue: 10 },
    });
    expect(verdict.title).toBe("小旗");
    expect(verdict.praise).toBe("残档没落下。人却换了几茬。");
    expect(verdict.roast).toBe("此谱三涂两改，墨色发花。");
  });

  it("does not give 指挥佥事 when the dossier is short", () => {
    const verdict = buildVerdict({
      searchCount: 34,
      reviseCount: 0,
      paperCount: 35,
    });
    expect(verdict.familiarity).toBeGreaterThanOrEqual(90);
    expect(verdict.title).toBe("千户");
  });

  it("is deterministic", () => {
    const input = { searchCount: 50, reviseCount: 3, paperCount: 20 };
    expect(buildVerdict(input)).toEqual(buildVerdict(input));
  });
});

describe("closedLine", () => {
  it("prints the office", () => {
    expect(closedLine({ title: "百户" })).toBe("锦衣卫叙功百户。");
  });
});
