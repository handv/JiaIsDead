import { describe, expect, it } from "vitest";
import garden from "../data/garden.json";
import gardenPeople from "../data/gardenPeople.json";
import { allGardenSlots, emptyGardenPlacements, optionsByKind } from "./garden.js";
import { isSlotCorrect, nextVerifiedIds } from "./scoreBatch.js";

const slots = allGardenSlots();

describe("garden roster", () => {
  it("has eight courts and twenty-five slots", () => {
    expect(garden.courts).toHaveLength(8);
    expect(slots).toHaveLength(25);
    expect(new Set(slots.map((slot) => slot.id)).size).toBe(25);
  });

  it("keeps 栊翠庵 without maids", () => {
    const court = garden.courts.find((item) => item.id === "longcui");
    expect(court.slots.map((slot) => slot.kind)).toEqual(["place", "master"]);
  });

  it("separates place, master, and maid lists", () => {
    expect(optionsByKind("place").some((item) => item.id === "place-yihong")).toBe(true);
    expect(optionsByKind("master").some((item) => item.id === "miaoyu")).toBe(true);
    expect(optionsByKind("maid").some((item) => item.id === "xiren")).toBe(true);
    expect(optionsByKind("place").some((item) => item.id === "baoyu")).toBe(false);
    expect(optionsByKind("master").some((item) => item.id === "xiren")).toBe(false);
  });

  it("answers exist in the matching lists", () => {
    const ids = {
      place: new Set(gardenPeople.places.map((item) => item.id)),
      master: new Set(gardenPeople.masters.map((item) => item.id)),
      maid: new Set(gardenPeople.maids.map((item) => item.id)),
    };
    for (const slot of slots) {
      expect(ids[slot.kind].has(slot.personId)).toBe(true);
    }
  });
});

describe("garden locking", () => {
  it("locks three correct name-only slots together", () => {
    const three = slots.slice(0, 3);
    const placements = emptyGardenPlacements(three);
    for (const slot of three) {
      placements[slot.id] = { personId: slot.personId, role: "" };
    }
    expect(three.every((slot) => isSlotCorrect(placements[slot.id], slot))).toBe(true);
    expect(nextVerifiedIds(placements, three, [])).toEqual(three.map((slot) => slot.id));
  });
});
