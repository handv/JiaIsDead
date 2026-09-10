import { describe, expect, it } from "vitest";
import { hasProgress, playScreenOf } from "./storage.js";

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
    expect(playScreenOf("document")).toBe("desk");
    expect(playScreenOf("home")).toBe(null);
  });
});
