import { describe, expect, it } from "vitest";
import garden from "../data/garden.json";
import gardenPeople from "../data/gardenPeople.json";
import {
  allGardenSlots,
  availableGardenSources,
  emptyGardenPlacements,
  filledCount,
  GARDEN_CLEARANCE,
  gardenCluesForCourtCount,
  gardenCluesGrantedAt,
  gardenSearchEntries,
  gardenStarterIds,
  isCourtComplete,
  mergeGardenUnlockedIds,
  nextGardenLockIds,
  searchTermOf,
  optionIdsUnlockedByPapers,
  optionsByKind,
  optionsForCourt,
  papersInGardenSource,
  searchableGardenEntries,
  gardenSources,
} from "./garden.js";
import gardenEvidence from "../data/gardenEvidence.json";
import { entriesInSource, search } from "./search.js";
import { collectPeople } from "./unlock.js";

const slots = allGardenSlots();

function fillCourt(court, swapMaids = false) {
  const placements = emptyGardenPlacements();
  const maids = court.slots.filter((slot) => slot.kind === "maid");
  for (const slot of court.slots) {
    if (slot.kind === "maid") continue;
    placements[slot.id] = { personId: slot.personId, role: "" };
  }
  if (swapMaids && maids.length === 2) {
    placements[maids[0].id] = { personId: maids[1].personId, role: "" };
    placements[maids[1].id] = { personId: maids[0].personId, role: "" };
  } else {
    for (const slot of maids) {
      placements[slot.id] = { personId: slot.personId, role: "" };
    }
  }
  return placements;
}

describe("garden roster", () => {
  it("has eight courts and thirty-two slots", () => {
    expect(garden.courts).toHaveLength(8);
    expect(slots).toHaveLength(32);
    expect(new Set(slots.map((slot) => slot.id)).size).toBe(32);
  });

  it("keeps 稻香村 and 栊翠庵 without maids", () => {
    const daoxiang = garden.courts.find((item) => item.id === "daoxiang");
    expect(daoxiang.slots.map((slot) => slot.kind)).toEqual([
      "place",
      "master",
      "hao",
    ]);
    expect(gardenPeople.maids.some((item) => item.id === "suyun")).toBe(false);
  });

  it("keeps 栊翠庵 without maids", () => {
    const court = garden.courts.find((item) => item.id === "longcui");
    expect(court.slots.map((slot) => slot.kind)).toEqual(["place", "master", "hao"]);
  });

  it("separates place, master, maid, and hao lists", () => {
    expect(optionsByKind("place").some((item) => item.id === "place-yihong")).toBe(true);
    expect(optionsByKind("master").some((item) => item.id === "miaoyu")).toBe(true);
    expect(optionsByKind("maid").some((item) => item.id === "xiren")).toBe(true);
    expect(optionsByKind("hao").some((item) => item.id === "hao-hengwu")).toBe(true);
    expect(optionsByKind("place").some((item) => item.id === "baoyu")).toBe(false);
    expect(optionsByKind("master").some((item) => item.id === "xiren")).toBe(false);
    expect(optionsByKind("hao").some((item) => item.id === "baoyu")).toBe(false);
  });

  it("answers exist in the matching lists", () => {
    const ids = {
      place: new Set(gardenPeople.places.map((item) => item.id)),
      master: new Set(gardenPeople.masters.map((item) => item.id)),
      maid: new Set(gardenPeople.maids.map((item) => item.id)),
      hao: new Set(gardenPeople.haos.map((item) => item.id)),
    };
    for (const slot of slots) {
      expect(ids[slot.kind].has(slot.personId)).toBe(true);
    }
  });
});

describe("garden locking", () => {
  it("locks a court only when every slot is right", () => {
    const court = garden.courts.find((item) => item.id === "hengwu");
    const placements = fillCourt(court);
    expect(filledCount(court, placements)).toBe(4);
    expect(isCourtComplete(court, placements)).toBe(true);
    expect(nextGardenLockIds(court, placements, [])).toEqual(
      court.slots.map((slot) => slot.id),
    );
  });

  it("keeps a filled but wrong court unlocked", () => {
    const court = garden.courts.find((item) => item.id === "hengwu");
    const placements = fillCourt(court);
    placements["hengwu-name"] = { personId: "place-yihong", role: "" };
    expect(filledCount(court, placements)).toBe(4);
    expect(isCourtComplete(court, placements)).toBe(false);
    expect(nextGardenLockIds(court, placements, [])).toEqual([]);
  });

  it("accepts swapped maids in 怡红院", () => {
    const court = garden.courts.find((item) => item.id === "yihong");
    const placements = fillCourt(court, true);
    expect(isCourtComplete(court, placements)).toBe(true);
    expect(nextGardenLockIds(court, placements, [])).toHaveLength(5);
  });

  it("hides locked names from other courts", () => {
    const hengwu = garden.courts.find((item) => item.id === "hengwu");
    const placements = fillCourt(hengwu);
    const locked = hengwu.slots.map((slot) => slot.id);
    const places = optionsForCourt("place", "yihong", placements, locked);
    expect(places.some((item) => item.id === "place-hengwu")).toBe(false);
    expect(places.some((item) => item.id === "place-yihong")).toBe(true);
  });
});

describe("garden papers", () => {
  it("opens three desk papers and unlocks the rest by green courts", () => {
    expect(gardenStarterIds(gardenEvidence)).toEqual(["G01", "G03", "G09"]);
    expect(gardenCluesGrantedAt(1)).toEqual(["G05", "G11", "G20"]);
    expect(gardenCluesGrantedAt(2)).toEqual(["G04", "G07", "G13"]);
    expect(gardenCluesGrantedAt(3)).toEqual(["G08", "G12", "G18"]);
    const unlocked = mergeGardenUnlockedIds([], [], gardenEvidence);
    expect(unlocked).toEqual(["G01", "G03", "G09"]);
    expect(gardenCluesForCourtCount(8)).toHaveLength(14);
    const allIds = gardenEvidence.map((item) => item.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(new Set([...gardenStarterIds(gardenEvidence), ...gardenCluesForCourtCount(8)])).toEqual(
      new Set(allIds),
    );
  });

  it("keeps a garden clearance slip", () => {
    expect(GARDEN_CLEARANCE.name).toBe("大观园还在纸上");
    expect(GARDEN_CLEARANCE.kicker).toBe("锦衣卫核园札");
    expect(GARDEN_CLEARANCE.roast).toContain("人去楼空");
    expect(GARDEN_CLEARANCE.praise).toContain("白茫茫大地");
  });

  it("lets the first grant finish 栊翠庵", () => {
    const papers = [
      ...gardenStarterIds(gardenEvidence),
      ...gardenCluesForCourtCount(1),
    ];
    const options = optionIdsUnlockedByPapers(papers, gardenEvidence);
    const longcui = garden.courts.find((item) => item.id === "longcui");
    for (const slot of longcui.slots) {
      expect(options.has(slot.personId)).toBe(true);
    }
  });

  it("lets the second grant finish 缀锦楼", () => {
    const papers = [
      ...gardenStarterIds(gardenEvidence),
      ...gardenCluesForCourtCount(2),
    ];
    const options = optionIdsUnlockedByPapers(papers, gardenEvidence);
    const zhuijin = garden.courts.find((item) => item.id === "zhuijin");
    for (const slot of zhuijin.slots) {
      if (slot.kind === "master") continue;
      expect(options.has(slot.personId)).toBe(true);
    }
  });

  it("covers fill-in clues and omits 素云", () => {
    const text = gardenEvidence.map((item) => item.body.join("")).join("");
    for (const needle of [
      "晓翠堂",
      "秋爽斋",
      "蕉下客",
      "缀锦楼",
      "暖香坞",
      "藕榭",
      "怡红院",
      "潇湘馆",
      "蘅芜苑",
      "稻香村",
      "栊翠庵",
      "怡红公子",
      "潇湘妃子",
      "蘅芜君",
      "稻香老农",
      "菱洲",
      "槛外人",
      "袭人",
      "晴雯",
      "紫鹃",
      "雪雁",
      "莺儿",
      "侍书",
      "司棋",
      "入画",
    ]) {
      expect(text).toContain(needle);
    }
    expect(text).not.toContain("素云");
    expect(text).not.toContain("酒旗");
  });

  it("dates every paper with a 干支 like the main case", () => {
    const ganzhi = /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/;
    for (const paper of gardenEvidence) {
      const date = paper.body.at(-1);
      expect(date, paper.id).toMatch(ganzhi);
    }
  });

  it("keeps paper clues but does not put them in the map until searched", () => {
    const starterPapers = optionIdsUnlockedByPapers(
      gardenStarterIds(gardenEvidence),
      gardenEvidence,
    );
    expect(starterPapers.has("place-qiushuang")).toBe(true);
    const empty = new Set();
    const places = optionsForCourt(
      "place",
      "qiushuang",
      emptyGardenPlacements(),
      [],
      garden,
      empty,
    );
    expect(places).toEqual([]);
    const afterSearch = optionsForCourt(
      "place",
      "qiushuang",
      emptyGardenPlacements(),
      [],
      garden,
      new Set(["place-qiushuang"]),
    );
    expect(afterSearch.some((item) => item.id === "place-qiushuang")).toBe(true);
    const masters = optionsForCourt(
      "master",
      "qiushuang",
      emptyGardenPlacements(),
      [],
      garden,
      empty,
    );
    expect(masters.some((item) => item.id === "tanchun")).toBe(true);
    expect(masters.some((item) => item.id === "miaoyu")).toBe(false);
    const afterMiaoyu = optionsForCourt(
      "master",
      "longcui",
      emptyGardenPlacements(),
      [],
      garden,
      new Set(["miaoyu"]),
    );
    expect(afterMiaoyu.some((item) => item.id === "miaoyu")).toBe(true);
  });
});

describe("garden archive", () => {
  it("files every paper into exactly one 匣", () => {
    const allIds = gardenEvidence.map((item) => item.id);
    const filed = gardenSources.flatMap((item) => item.paperIds);
    expect(new Set(filed).size).toBe(filed.length);
    expect(new Set(filed)).toEqual(new Set(allIds));
  });

  it("lists starter papers in 园中见闻、晓翠堂灯下", () => {
    const starter = gardenStarterIds(gardenEvidence);
    const qingke = gardenSources.find((item) => item.id === "qingke");
    const yihong = gardenSources.find((item) => item.id === "yihong");
    const dengxia = gardenSources.find((item) => item.id === "dengxia");
    expect(papersInGardenSource(qingke, starter, gardenEvidence).map((item) => item.id)).toEqual(
      ["G01", "G03"],
    );
    expect(papersInGardenSource(yihong, starter, gardenEvidence)).toEqual([]);
    expect(
      papersInGardenSource(dengxia, starter, gardenEvidence).map((item) => item.id),
    ).toEqual(["G09"]);
    const invite = gardenSources.find((item) => item.id === "invite");
    expect(papersInGardenSource(invite, starter, gardenEvidence)).toEqual([]);
  });
});

describe("garden search", () => {
  const entries = gardenSearchEntries(gardenEvidence);
  const starter = gardenStarterIds(gardenEvidence);

  it("puts every paper clue into the matching 匣, and the name on that paper", () => {
    for (const paper of gardenEvidence) {
      const text = paper.body.join("");
      for (const optionId of paper.unlocks ?? []) {
        expect(text).toContain(searchTermOf(optionId, paper));
      }
    }
    const needed = new Set();
    for (const slot of slots) {
      if (slot.kind === "master" && slot.personId !== "miaoyu") continue;
      needed.add(slot.personId);
    }
    const unlocked = new Set(
      entries.flatMap((entry) => entry.unlocksPeople ?? []),
    );
    for (const id of needed) {
      expect(unlocked.has(id)).toBe(true);
    }
  });

  it("only verifies keywords from papers already on the desk", () => {
    const open = searchableGardenEntries(entries, starter);
    const qiushuang = search("晓翠堂", entriesInSource(open, "dengxia"));
    expect(qiushuang.status).toBe("ok");
    expect(collectPeople(qiushuang.hits)).toContain("place-qiushuang");
    expect(search("晓翠堂", entriesInSource(open, "qingke")).status).toBe("empty");
    expect(search("怡红公子", entriesInSource(open, "invite")).status).toBe("empty");
    expect(search("怡红公子", entriesInSource(open, "yihong")).status).toBe("empty");
    const withInvite = searchableGardenEntries(entries, [...starter, "G08"]);
    expect(search("怡红公子", entriesInSource(withInvite, "yihong")).status).toBe("ok");
    expect(search("怡红公子", entriesInSource(withInvite, "invite")).status).toBe("empty");
    expect(
      availableGardenSources(gardenSources, starter).map((item) => item.id),
    ).toEqual(["qingke", "dengxia"]);
  });
});
