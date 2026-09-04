import { describe, expect, it } from "vitest";
import evidenceList from "../data/evidence.json";
import peopleData from "../data/people.json";
import roleLexicon from "../data/roles.json";
import searchEntries from "../data/searches.json";
import { collectUnlocks, search } from "./search.js";
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

  it("贾政 unlocks the name; 员外郎 is a clue to the same person, not a title unlock", () => {
    expect(collectPeople(search("贾政", searchEntries).hits)).toEqual(["zheng"]);
    expect(collectRoles(search("贾政", searchEntries).hits)).toEqual([]);
    expect(collectPeople(search("员外郎", searchEntries).hits)).toEqual(["zheng"]);
    expect(collectRoles(search("员外郎", searchEntries).hits)).toEqual([]);
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

  it("旌表 and 丧榜 open the parent-trail documents", () => {
    expect(collectUnlocks(search("旌表", searchEntries).hits)).toEqual(["E10"]);
    expect(collectPeople(search("旌表", searchEntries).hits)).toEqual([]);
    expect(collectUnlocks(search("丧榜", searchEntries).hits)).toEqual(["E14"]);
    expect(collectUnlocks(search("点名簿", searchEntries).hits)).toEqual(["E13"]);
  });
});

describe("occupation lexicon", () => {
  const titledOffices = new Set(["宁国公", "荣国公"]);
  const roles = [
    ...new Set(
      [...peopleData.people, ...peopleData.decoys].map((person) => person.role),
    ),
  ].filter((role) => !titledOffices.has(role));

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

  it("glosses every occupation on the clerk table", () => {
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
    expect(roleLexicon.find((item) => item.id === "都检")?.gloss).toMatch(/京营/);
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
