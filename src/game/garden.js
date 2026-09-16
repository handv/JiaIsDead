import garden from "../data/garden.json";
import gardenPeople from "../data/gardenPeople.json";
import { isSlotCorrect } from "./scoreBatch.js";

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

export function hintOf(kind) {
  if (kind === "place") return "匾额";
  if (kind === "master") return "主人";
  if (kind === "maid") return "丫鬟";
  return "";
}

export function filledCount(court, placements) {
  return court.slots.filter((slot) => placements?.[slot.id]?.personId).length;
}

export function isCourtLocked(court, lockedSlotIds = []) {
  return court.slots.every((slot) => lockedSlotIds.includes(slot.id));
}

function idsMatchAsSet(left, right) {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((id, index) => id === sortedRight[index]);
}

export function isCourtComplete(court, placements) {
  const maids = court.slots.filter((slot) => slot.kind === "maid");
  const others = court.slots.filter((slot) => slot.kind !== "maid");
  if (others.some((slot) => !isSlotCorrect(placements?.[slot.id], slot))) {
    return false;
  }
  if (!maids.length) return true;
  if (maids.some((slot) => !placements?.[slot.id]?.personId)) return false;
  return idsMatchAsSet(
    maids.map((slot) => placements[slot.id].personId),
    maids.map((slot) => slot.personId),
  );
}

export function nextGardenLockIds(court, placements, lockedSlotIds = []) {
  if (!isCourtComplete(court, placements)) return [];
  return court.slots
    .filter((slot) => !lockedSlotIds.includes(slot.id))
    .map((slot) => slot.id);
}

export function optionsForCourt(kind, courtId, placements, lockedSlotIds, data = garden) {
  const taken = new Set();
  for (const court of data.courts) {
    if (court.id === courtId) continue;
    for (const slot of court.slots) {
      if (slot.kind !== kind) continue;
      if (!lockedSlotIds.includes(slot.id)) continue;
      const personId = placements?.[slot.id]?.personId;
      if (personId) taken.add(personId);
    }
  }
  return optionsByKind(kind).filter((item) => !taken.has(item.id));
}
