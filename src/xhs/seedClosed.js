import batch1 from "../data/batch1.json";
import batch2 from "../data/batch2.json";
import batch3 from "../data/batch3.json";
import batch4 from "../data/batch4.json";
import batch5 from "../data/batch5.json";
import evidenceList from "../data/evidence.json";
import peopleData from "../data/people.json";
import gardenEvidence from "../data/gardenEvidence.json";
import { buildVerdict } from "../game/familiarity.js";
import { gardenStarterIds } from "../game/garden.js";

export function seedClosedCase() {
  const slots = [
    ...batch1.slots,
    ...batch2.slots,
    ...batch3.slots,
    ...batch4.slots,
    ...batch5.slots,
  ];
  const placements = {};
  for (const slot of slots) {
    placements[slot.id] = {
      personId: slot.personId ?? "",
      role: slot.role ?? "",
    };
  }
  const searchCount = 40;
  const reviseCount = 2;
  const reviseByHouse = { ning: 0, rong: 1, kin: 0 };
  return {
    unlockedIds: evidenceList.map((item) => item.id),
    unlockedPersonIds: peopleData.people.map((person) => person.id),
    placements,
    lockedSlotIds: slots.map((slot) => slot.id),
    searchHistory: [],
    searchCount,
    reviseCount,
    reviseByHouse,
    verdict: buildVerdict({
      searchCount,
      reviseCount,
      paperCount: evidenceList.length,
      reviseByHouse,
    }),
    gardenPlacements: {},
    gardenLockedSlotIds: [],
    gardenUnlockedIds: gardenStarterIds(gardenEvidence),
    gardenUnlockedOptionIds: [],
    gardenSearchHistory: [],
    gardenSearchCount: 0,
    gardenReviseCount: 0,
  };
}
