import { describe, expect, it } from "vitest";
import garden from "../data/garden.json";
import gardenPeople from "../data/gardenPeople.json";
import {
  allGardenSlots,
  emptyGardenPlacements,
  filledCount,
  isCourtComplete,
  nextGardenLockIds,
  optionsByKind,
  optionsForCourt,
} from "./garden.js";

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
  it("locks a court only when every slot is right", () => {
    const court = garden.courts.find((item) => item.id === "hengwu");
    const placements = fillCourt(court);
    expect(filledCount(court, placements)).toBe(3);
    expect(isCourtComplete(court, placements)).toBe(true);
    expect(nextGardenLockIds(court, placements, [])).toEqual(
      court.slots.map((slot) => slot.id),
    );
  });

  it("keeps a filled but wrong court unlocked", () => {
    const court = garden.courts.find((item) => item.id === "hengwu");
    const placements = fillCourt(court);
    placements["hengwu-name"] = { personId: "place-yihong", role: "" };
    expect(filledCount(court, placements)).toBe(3);
    expect(isCourtComplete(court, placements)).toBe(false);
    expect(nextGardenLockIds(court, placements, [])).toEqual([]);
  });

  it("accepts swapped maids in 怡红院", () => {
    const court = garden.courts.find((item) => item.id === "yihong");
    const placements = fillCourt(court, true);
    expect(isCourtComplete(court, placements)).toBe(true);
    expect(nextGardenLockIds(court, placements, [])).toHaveLength(4);
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
