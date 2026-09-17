import garden from "../data/garden.json";
import gardenPeople from "../data/gardenPeople.json";
import gardenSources from "../data/gardenSources.json";
import { isSlotCorrect } from "./scoreBatch.js";

export { gardenSources };

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
  if (kind === "hao") return gardenPeople.haos;
  return [];
}

export function nameOf(id) {
  const all = [
    ...gardenPeople.places,
    ...gardenPeople.masters,
    ...gardenPeople.maids,
    ...gardenPeople.haos,
  ];
  return all.find((item) => item.id === id)?.name ?? "";
}

export function searchTermOf(optionId) {
  if (optionId === "place-qiushuang") return "晓翠堂";
  return nameOf(optionId);
}

export function hintOf(kind) {
  if (kind === "place") return "匾额";
  if (kind === "master") return "主人";
  if (kind === "hao") return "雅号";
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

export const GARDEN_CLUE_AT = [
  { count: 1, ids: ["G04", "G05", "G06"] },
  { count: 2, ids: ["G07", "G08", "G10"] },
  { count: 3, ids: ["G11", "G12"] },
  { count: 4, ids: ["G18", "G19", "G13"] },
  { count: 5, ids: ["G20"] },
  { count: 6, ids: ["G16"] },
  { count: 7, ids: ["G17"] },
];

export function lockedCourtCount(lockedSlotIds = [], data = garden) {
  return data.courts.filter((court) => isCourtLocked(court, lockedSlotIds))
    .length;
}

export function gardenStarterIds(list) {
  return (list ?? []).filter((item) => item.onDesk).map((item) => item.id);
}

export function gardenCluesForCourtCount(count) {
  const n = Number(count) || 0;
  return GARDEN_CLUE_AT.filter((item) => n >= item.count).flatMap(
    (item) => item.ids,
  );
}

export function gardenCluesGrantedAt(count) {
  const n = Number(count) || 0;
  return GARDEN_CLUE_AT.find((item) => item.count === n)?.ids ?? [];
}

export function mergeGardenUnlockedIds(savedIds, lockedSlotIds = [], list = []) {
  return [
    ...new Set([
      ...gardenStarterIds(list),
      ...gardenCluesForCourtCount(lockedCourtCount(lockedSlotIds)),
      ...(savedIds ?? []),
    ]),
  ];
}

export function optionIdsUnlockedByPapers(paperIds, list = []) {
  const allowed = new Set();
  const byId = new Map((list ?? []).map((item) => [item.id, item]));
  for (const id of paperIds ?? []) {
    const doc = byId.get(id);
    for (const optionId of doc?.unlocks ?? []) allowed.add(optionId);
  }
  return allowed;
}

export function papersInGardenSource(
  source,
  unlockedIds,
  list = [],
) {
  if (!source) return [];
  const allowed = new Set(unlockedIds ?? []);
  return list.filter(
    (paper) => source.paperIds.includes(paper.id) && allowed.has(paper.id),
  );
}

export function gardenRoster() {
  return [
    ...gardenPeople.places,
    ...gardenPeople.masters,
    ...gardenPeople.maids,
    ...gardenPeople.haos,
  ];
}

export function availableGardenSources(sourceList = gardenSources, unlockedIds = []) {
  const allowed = new Set(unlockedIds ?? []);
  return sourceList.filter((item) =>
    (item.paperIds ?? []).some((id) => allowed.has(id)),
  );
}

function snippetFor(paper, term) {
  const para = (paper.body ?? []).find((line) => line.includes(term)) ?? paper.body?.[0] ?? "";
  if (para.length <= 56) return para;
  return `${para.slice(0, 56)}…`;
}

export function gardenSearchEntries(list = [], sources = gardenSources) {
  const paperToSource = new Map();
  for (const source of sources) {
    for (const id of source.paperIds ?? []) paperToSource.set(id, source.id);
  }
  const entries = [];
  for (const paper of list) {
    const source = paperToSource.get(paper.id);
    if (!source) continue;
    for (const optionId of paper.unlocks ?? []) {
      const term = searchTermOf(optionId);
      if (!term) continue;
      entries.push({
        id: `gs-${paper.id}-${optionId}`,
        source,
        terms: [term],
        title: `${paper.title} · ${term}`,
        snippet: snippetFor(paper, term),
        unlocksPeople: [optionId],
        unlocksEvidenceId: paper.id,
      });
    }
  }
  return entries;
}

export function searchableGardenEntries(entries, unlockedIds = []) {
  const allowed = new Set(unlockedIds ?? []);
  return (entries ?? []).filter((entry) => allowed.has(entry.unlocksEvidenceId));
}

export function gardenSearchTerms(entries = []) {
  return [
    ...new Set(
      entries.flatMap((entry) =>
        entry.unlocksPeople?.length ? entry.terms : [],
      ),
    ),
  ].sort((left, right) => right.length - left.length);
}

export function optionsForCourt(
  kind,
  courtId,
  placements,
  lockedSlotIds,
  data = garden,
  unlockedOptionIds = null,
  extraIds = [],
) {
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
  return optionsByKind(kind).filter((item) => {
    if (taken.has(item.id)) return false;
    if (kind === "master") return true;
    if (!unlockedOptionIds) return true;
    if (unlockedOptionIds.has(item.id)) return true;
    return extraIds.includes(item.id);
  });
}
