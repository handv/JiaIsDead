import { describe, expect, it } from "vitest";
import evidenceList from "../data/evidence.json";
import peopleData from "../data/people.json";
import roleLexicon from "../data/roles.json";
import searchEntries from "../data/searches.json";
import sources from "../data/sources.json";
import {
  availableSources,
  collectUnlocks,
  entriesInSource,
  pushSearchHistory,
  search,
  sourcesOpenedAt,
} from "./search.js";
import { collectPeople, collectRoles, peopleInUnlockOrder } from "./unlock.js";

const entries = [
  {
    id: "s-ning",
    terms: ["宁国公", "宁国府"],
    unlocksEvidenceId: "E03",
  },
  {
    id: "s-fu",
    terms: ["贾不假", "护官符"],
    unlocksEvidenceId: "E02",
  },
  {
    id: "s-baoyu",
    terms: ["贾宝玉"],
    unlocksEvidenceId: null,
  },
];

describe("pushSearchHistory", () => {
  it("puts the newest term first and drops duplicates", () => {
    expect(pushSearchHistory(["贾政", "宁国公"], "贾政")).toEqual(["贾政", "宁国公"]);
    expect(pushSearchHistory(["贾政"], "宁国公")).toEqual(["宁国公", "贾政"]);
    expect(pushSearchHistory(["贾政"], "贾 政")).toEqual(["贾 政"]);
    expect(pushSearchHistory(["贾政"], "  ")).toEqual(["贾政"]);
  });
});

describe("search", () => {
  it("rejects short queries", () => {
    expect(search("贾", entries).status).toBe("short");
  });

  it("finds 宁国公 and unlocks E03", () => {
    const result = search("宁国公", entries);
    expect(result.status).toBe("ok");
    expect(result.hits.map((h) => h.id)).toEqual(["s-ning"]);
    expect(collectUnlocks(result.hits)).toEqual(["E03"]);
  });

  it("finds a 护官符 phrase", () => {
    const result = search("贾不假，白玉为堂", entries);
    expect(result.hits.map((h) => h.id)).toEqual(["s-fu"]);
  });

  it("returns empty for unknown names", () => {
    expect(search("妙玉", entries)).toEqual({ status: "empty", hits: [] });
  });

  it("can hit a decoy with no unlock", () => {
    const result = search("贾宝玉", entries);
    expect(result.hits[0].id).toBe("s-baoyu");
    expect(collectUnlocks(result.hits)).toEqual([]);
  });
});

describe("search sources", () => {
  const sourceIds = new Set(sources.map((item) => item.id));

  it("puts every index row in a known archive", () => {
    expect(searchEntries.length).toBeGreaterThan(0);
    for (const entry of searchEntries) {
      expect(sourceIds.has(entry.source)).toBe(true);
    }
  });

  it("does not leave an archive empty", () => {
    for (const source of sources) {
      expect(entriesInSource(searchEntries, source.id).length).toBeGreaterThan(0);
    }
  });

  it("opens archives in waves, not all at once", () => {
    expect(availableSources(sources, 0).map((item) => item.id)).toEqual([
      "dibao",
      "yamen",
      "citang",
    ]);
    expect(availableSources(sources, 3).map((item) => item.id)).toEqual([
      "dibao",
      "yamen",
      "citang",
      "rong-zhang",
      "waiqin",
    ]);
    expect(availableSources(sources, 6).map((item) => item.id)).toContain(
      "ning-si",
    );
    expect(availableSources(sources, 6).map((item) => item.id)).toContain(
      "ning-nei",
    );
    expect(availableSources(sources, 8).map((item) => item.id)).not.toContain(
      "rong-nei",
    );
    expect(availableSources(sources, 9).map((item) => item.id)).toEqual(
      sources.map((item) => item.id),
    );
  });

  it("names archives that open on a third lock", () => {
    expect(sourcesOpenedAt(sources, 3).map((item) => item.title)).toEqual([
      "荣府账房",
      "外亲来函",
    ]);
    expect(sourcesOpenedAt(sources, 6).map((item) => item.title)).toEqual([
      "宁府司房",
      "宁府内宅",
    ]);
    expect(sourcesOpenedAt(sources, 9).map((item) => item.title)).toEqual([
      "荣府内宅",
    ]);
    expect(sourcesOpenedAt(sources, 12)).toEqual([]);
  });

  it("same name hits one archive and misses another", () => {
    const yamen = entriesInSource(searchEntries, "yamen");
    const dibao = entriesInSource(searchEntries, "dibao");
    const citang = entriesInSource(searchEntries, "citang");
    expect(collectPeople(search("贾政", entriesInSource(searchEntries, "rong-zhang")).hits)).toEqual(["zheng"]);
    expect(search("贾政", yamen).status).toBe("empty");
    expect(search("贾政", dibao).status).toBe("empty");
    expect(collectPeople(search("贾演", citang).hits)).toEqual(["yan"]);
    expect(search("贾演", yamen).status).toBe("empty");
    expect(collectPeople(search("林如海", entriesInSource(searchEntries, "waiqin")).hits)).toEqual([
      "ruhai",
    ]);
    expect(search("林如海", yamen).status).toBe("empty");
  });
});

describe("catalog unlocks from real data", () => {
  it("宗祠 opens the tablet but does not name anyone", () => {
    const result = search("宗祠", searchEntries);
    expect(collectUnlocks(result.hits)).toEqual(["E04"]);
    expect(collectPeople(result.hits)).toEqual([]);
  });

  it("贾演 unlocks only that name", () => {
    const result = search("贾演", searchEntries);
    expect(collectPeople(result.hits)).toEqual(["yan"]);
  });

  it("宁国公 opens the Ning fragment and does not add a name or a new title", () => {
    const result = search("宁国公", searchEntries);
    expect(collectUnlocks(result.hits)).toEqual(["E03"]);
    expect(collectPeople(result.hits)).toEqual([]);
    expect(collectRoles(result.hits)).toEqual([]);
  });

  it("荣国公 opens the Rong fragment, not the Ning one", () => {
    expect(collectUnlocks(search("荣国公", searchEntries).hits)).toEqual(["E08"]);
    expect(collectPeople(search("荣国公", searchEntries).hits)).toEqual([]);
  });

  it("贾政 unlocks the name; 政老爷 is a clue to the same person, not a title unlock", () => {
    expect(collectPeople(search("贾政", searchEntries).hits)).toEqual(["zheng"]);
    expect(collectRoles(search("贾政", searchEntries).hits)).toEqual([]);
    expect(search("员外郎", searchEntries).status).toBe("empty");
    expect(collectPeople(search("政老爷", searchEntries).hits)).toEqual(["zheng"]);
    expect(collectUnlocks(search("政老爷", searchEntries).hits)).toEqual(["E18"]);
  });

  it("袭了一等 and 威烈 point at the two generals, not the full title", () => {
    expect(collectPeople(search("袭了一等", searchEntries).hits)).toEqual(["she"]);
    expect(collectUnlocks(search("袭了一等", searchEntries).hits)).toEqual(["E17"]);
    expect(collectPeople(search("威烈", searchEntries).hits)).toEqual(["zhen"]);
    expect(collectUnlocks(search("威烈", searchEntries).hits)).toEqual(["E14"]);
  });

  it("林如海 unlocks the husband and the letter, not 贾敏", () => {
    const result = search("林如海", searchEntries);
    expect(collectPeople(result.hits)).toEqual(["ruhai"]);
    expect(collectUnlocks(result.hits)).toEqual(["E06"]);
    expect(collectPeople(search("贾敏", searchEntries).hits)).toEqual(["min"]);
  });

  it("史太君 and 黛玉 unlock marriage-batch names", () => {
    expect(collectPeople(search("史太君", searchEntries).hits)).toEqual(["jiamu"]);
    expect(collectUnlocks(search("史太君", searchEntries).hits)).toEqual(["E05"]);
    expect(collectPeople(search("黛玉", searchEntries).hits)).toEqual(["daiyu"]);
    expect(collectUnlocks(search("黛玉", searchEntries).hits)).toEqual(["E24"]);
  });

  it("惜春 unlocks the name and the 素服, not the whole 丧榜", () => {
    const result = search("惜春", searchEntries);
    expect(collectPeople(result.hits)).toEqual(["xichun"]);
    expect(collectUnlocks(result.hits)).toEqual(["E30"]);
  });

  it("贾珠 unlocks the heir and the 旌表", () => {
    const result = search("贾珠", searchEntries);
    expect(collectPeople(result.hits)).toEqual(["zhu"]);
    expect(collectUnlocks(result.hits)).toEqual(["E10"]);
  });

  it("大嫂子、珠大爷 open the 旌表 and name the widow household", () => {
    expect(collectPeople(search("大嫂子", searchEntries).hits)).toEqual(["liwan"]);
    expect(collectUnlocks(search("大嫂子", searchEntries).hits)).toEqual(["E10"]);
    expect(collectPeople(search("珠大爷", searchEntries).hits)).toEqual(["zhu"]);
    expect(collectUnlocks(search("珠大爷", searchEntries).hits)).toEqual(["E10"]);
    expect(collectUnlocks(search("孀居", searchEntries).hits)).toEqual(["E10"]);
  });

  it("王子腾 stays off the roster and only opens the 京营 letter", () => {
    expect(collectPeople(search("王子腾", searchEntries).hits)).toEqual([]);
    expect(collectUnlocks(search("王子腾", searchEntries).hits)).toEqual(["E22"]);
    expect(collectUnlocks(search("京营", searchEntries).hits)).toEqual(["E22"]);
    expect(collectPeople(search("京营", searchEntries).hits)).toEqual([]);
  });

  it("护官符 poem points at the four houses, not back at itself", () => {
    expect(collectUnlocks(search("一个史", searchEntries).hits)).toEqual(["E05"]);
    expect(collectPeople(search("一个史", searchEntries).hits)).toEqual([]);
    expect(collectUnlocks(search("金陵王", searchEntries).hits)).toEqual(["E21"]);
    expect(collectUnlocks(search("好大雪", searchEntries).hits)).toEqual(["E23"]);
    expect(collectPeople(search("好大雪", searchEntries).hits)).toEqual([]);
  });

  it("宫花 opens E07 without adding a name", () => {
    const result = search("宫花", searchEntries);
    expect(collectUnlocks(result.hits)).toEqual(["E07"]);
    expect(collectPeople(result.hits)).toEqual([]);
  });

  it("旌表、丧榜 and 爬灰 open the parent-trail documents", () => {
    expect(collectUnlocks(search("旌表", searchEntries).hits)).toEqual(["E10"]);
    expect(collectPeople(search("旌表", searchEntries).hits)).toEqual([]);
    expect(collectUnlocks(search("丧榜", searchEntries).hits)).toEqual(["E14"]);
    expect(collectUnlocks(search("爬灰", searchEntries).hits)).toEqual(["E13"]);
  });

  it("元春 unlocks the name and the 册封, not a palace ticket", () => {
    const result = search("元春", searchEntries);
    expect(collectPeople(result.hits)).toEqual(["yuanchun"]);
    expect(collectUnlocks(result.hits)).toEqual(["E36"]);
    expect(search("银票", searchEntries).status).toBe("empty");
  });

  it("圣旨、省亲、如海遗言 open event papers without adding a name", () => {
    expect(collectUnlocks(search("圣旨", searchEntries).hits)).toEqual(["E36"]);
    expect(collectPeople(search("圣旨", searchEntries).hits)).toEqual([]);
    expect(collectUnlocks(search("省亲", searchEntries).hits)).toEqual(["E38"]);
    expect(collectPeople(search("省亲", searchEntries).hits)).toEqual([]);
    expect(collectUnlocks(search("旧馆", searchEntries).hits)).toEqual(["E37"]);
    expect(collectPeople(search("旧馆", searchEntries).hits)).toEqual([]);
  });
});

describe("occupation lexicon", () => {
  const titledOffices = new Set(["宁国公", "荣国公"]);
  const roles = [
    ...new Set(
      [...peopleData.people, ...peopleData.decoys].map((person) => person.role),
    ),
  ].filter((role) => !titledOffices.has(role));

  it("does not list the next scraps on the page margin", () => {
    const corpus = evidenceList.flatMap((item) => item.body).join("\n");
    expect(corpus).not.toMatch(/页边：/);
    expect(corpus).not.toMatch(/纸角：/);
  });

  it("does not print occupation labels in evidence or snippets", () => {
    const corpus = [
      ...evidenceList.flatMap((item) => item.body),
      ...searchEntries.map((entry) => entry.snippet),
    ].join("\n");
    for (const role of roles) {
      expect(corpus).not.toContain(role);
    }
  });

  it("does not use kinship phrases as occupations", () => {
    expect(roles.join(" ")).not.toMatch(/之妻|之女|嫡妻|续弦|胞妹|嫡长|嫡次|帮办/);
  });

  it("glosses every occupation used on the tree", () => {
    const allRoles = [
      ...new Set(
        [...peopleData.people, ...peopleData.decoys].map((person) => person.role),
      ),
    ];
    const glossed = new Set(roleLexicon.map((item) => item.id));
    for (const role of allRoles) {
      expect(glossed.has(role)).toBe(true);
    }
    expect(roleLexicon.find((item) => item.id === "主中馈")?.gloss).toBe("已嫁的太太");
    expect(roleLexicon.find((item) => item.id === "侧室")?.gloss).toBe("不是太太");
    expect(roleLexicon.find((item) => item.id === "家学")?.gloss).toMatch(/念书/);
  });

  it("另册 stamps open one scrap each and names stay off the index", () => {
    expect(collectUnlocks(search("又写一页", searchEntries).hits)).toEqual(["E31"]);
    expect(collectPeople(search("又写一页", searchEntries).hits)).toEqual([]);
    expect(collectUnlocks(search("花自芳", searchEntries).hits)).toEqual(["E32"]);
    expect(collectPeople(search("迎春", searchEntries).hits)).toEqual(["yingchun"]);
    expect(collectUnlocks(search("迎春", searchEntries).hits)).toEqual(["E32"]);
    expect(collectUnlocks(search("蕉下客", searchEntries).hits)).toEqual(["E33"]);
    expect(collectPeople(search("环哥儿", searchEntries).hits)).toEqual(["huan"]);
    expect(collectUnlocks(search("马道婆", searchEntries).hits)).toEqual(["E35"]);
  });

  it("草字 stamps open one scrap each and names stay off the index", () => {
    expect(collectUnlocks(search("园里孩子", searchEntries).hits)).toEqual(["E45"]);
    expect(collectPeople(search("园里孩子", searchEntries).hits)).toEqual([]);
    expect(collectUnlocks(search("孝子", searchEntries).hits)).toEqual(["E40"]);
    expect(collectPeople(search("蓉大爷", searchEntries).hits)).toEqual(["rong"]);
    expect(collectUnlocks(search("内廷侍卫", searchEntries).hits)).toEqual(["E40"]);
    expect(collectPeople(search("内廷侍卫", searchEntries).hits)).toEqual([]);
    expect(collectUnlocks(search("兰儿", searchEntries).hits)).toEqual(["E41"]);
    expect(collectPeople(search("兰哥", searchEntries).hits)).toEqual(["lan"]);
    expect(collectUnlocks(search("兰哥", searchEntries).hits)).toEqual(["E41"]);
    expect(collectPeople(search("巧姐", searchEntries).hits)).toEqual(["qiaojie"]);
    expect(collectUnlocks(search("密字", searchEntries).hits)).toEqual(["E43"]);
    expect(collectPeople(search("可卿", searchEntries).hits)).toEqual(["keqing"]);
    expect(collectUnlocks(search("金锁", searchEntries).hits)).toEqual(["E44"]);
    expect(collectPeople(search("宝钗", searchEntries).hits)).toEqual(["baochai"]);
  });
});

describe("peopleInUnlockOrder", () => {
  it("lists names in discovery order, not roster order", () => {
    const roster = [
      { id: "yan", name: "贾演" },
      { id: "yuan", name: "贾源" },
      { id: "zheng", name: "贾政" },
    ];
    const names = peopleInUnlockOrder(roster, ["zheng", "yuan", "yan"]).map(
      (person) => person.name,
    );
    expect(names).toEqual(["贾政", "贾源", "贾演"]);
  });
});
