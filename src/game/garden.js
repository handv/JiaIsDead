import garden from "../data/garden.json";
import gardenPeople from "../data/gardenPeople.json";

export const GARDEN_MAP = garden;

export function allGardenSlots(data = garden) {
  return data.courts.flatMap((court) =>
    court.slots.map((slot) => ({ ...slot, courtId: court.id })),
  );
}

export function emptyGardenPlacements(slots = allGardenSlots()) {
  const next = {};
  for (const slot of slots) {
    next[slot.id] = { personId: "", role: "" };
  }
  return next;
}

export function mergeGardenPlacements(saved, slots = allGardenSlots()) {
  return { ...emptyGardenPlacements(slots), ...(saved ?? {}) };
}

export function hasGardenProgress(placements, lockedSlotIds = []) {
  if (lockedSlotIds.length) return true;
  return Object.values(placements ?? {}).some((item) => item?.personId);
}

export function optionsByKind(kind) {
  if (kind === "place") return gardenPeople.places;
  if (kind === "master") return gardenPeople.masters;
  if (kind === "maid") return gardenPeople.maids;
  return [];
}

export function nameOf(id) {
  const all = [
    ...gardenPeople.places,
    ...gardenPeople.masters,
    ...gardenPeople.maids,
  ];
  return all.find((item) => item.id === id)?.name ?? "";
}
