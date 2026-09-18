import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearState, hasProgress, loadState, mainPlayScreenOf, playScreenOf, saveState } from "./storage.js";

function memoryStore() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

const starter = ["e1", "e2"];

describe("hasProgress", () => {
  it("treats empty or missing save as no progress", () => {
    expect(hasProgress(null, starter)).toBe(false);
    expect(hasProgress({ unlockedIds: starter, placements: {} }, starter)).toBe(false);
  });

  it("counts fills, locks, searches, extra papers, and a verdict", () => {
    expect(hasProgress({ placements: { a: { personId: "jia", role: "" } } }, starter)).toBe(true);
    expect(hasProgress({ lockedSlotIds: ["a"] }, starter)).toBe(true);
    expect(hasProgress({ unlockedPersonIds: ["jia"] }, starter)).toBe(true);
    expect(hasProgress({ searchCount: 1 }, starter)).toBe(true);
    expect(hasProgress({ searchHistory: ["贾"] }, starter)).toBe(true);
    expect(hasProgress({ unlockedIds: [...starter, "e9"] }, starter)).toBe(true);
    expect(hasProgress({ verdict: { familiarity: 70 } }, starter)).toBe(true);
  });
});

describe("playScreenOf", () => {
  it("maps in-case screens and ignores the cover", () => {
    expect(playScreenOf("tree")).toBe("tree");
    expect(playScreenOf("garden")).toBe("garden");
    expect(playScreenOf("garden-desk")).toBe("garden");
    expect(playScreenOf("garden-document")).toBe("garden");
    expect(playScreenOf("garden-search")).toBe("garden");
    expect(playScreenOf("document")).toBe("desk");
    expect(playScreenOf("home")).toBe(null);
  });

  it("keeps resume-from-cover on the main case", () => {
    expect(mainPlayScreenOf("tree")).toBe("tree");
    expect(mainPlayScreenOf("search")).toBe("search");
    expect(mainPlayScreenOf("document")).toBe("desk");
    expect(mainPlayScreenOf("garden")).toBe("desk");
    expect(mainPlayScreenOf("garden-desk")).toBe("desk");
    expect(mainPlayScreenOf("home")).toBe("desk");
  });
});

describe("clearState", () => {
  beforeEach(() => {
    globalThis.localStorage = memoryStore();
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it("wipes the main case and garden together", () => {
    saveState({
      unlockedIds: ["e1"],
      lockedSlotIds: ["a"],
      gardenLockedSlotIds: ["c1"],
      gardenUnlockedIds: ["G01", "G05"],
      gardenSearchCount: 8,
      gardenReviseCount: 2,
    });
    expect(loadState()?.lockedSlotIds).toEqual(["a"]);
    expect(loadState()?.gardenLockedSlotIds).toEqual(["c1"]);
    expect(loadState()?.gardenUnlockedIds).toEqual(["G01", "G05"]);
    expect(loadState()?.gardenSearchCount).toBe(8);
    expect(loadState()?.gardenReviseCount).toBe(2);
    clearState();
    expect(loadState()).toBe(null);
  });
});
