import { describe, expect, it } from "vitest";
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

  it("宁国公 opens the speech and does not add a name or a new title", () => {
    const result = search("宁国公", searchEntries);
    expect(collectUnlocks(result.hits)).toEqual(["E03"]);
    expect(collectPeople(result.hits)).toEqual([]);
    expect(collectRoles(result.hits)).toEqual([]);
  });

  it("贾政 unlocks the name; 员外郎 is a clue to the same person, not a title unlock", () => {
    expect(collectPeople(search("贾政", searchEntries).hits)).toEqual(["zheng"]);
    expect(collectRoles(search("贾政", searchEntries).hits)).toEqual([]);
    expect(collectPeople(search("员外郎", searchEntries).hits)).toEqual(["zheng"]);
    expect(collectRoles(search("员外郎", searchEntries).hits)).toEqual([]);
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
