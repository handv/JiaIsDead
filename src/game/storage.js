const KEY = "jia-clan-v17";

export function emptyReviseByHouse() {
  return { ning: 0, rong: 0, kin: 0 };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(state) {
  const snapshot = {
    unlockedIds: state.unlockedIds,
    unlockedPersonIds: state.unlockedPersonIds,
    placements: state.placements,
    lockedSlotIds: state.lockedSlotIds,
    searchHistory: state.searchHistory ?? [],
    searchCount: Number(state.searchCount) || 0,
    reviseCount: Number(state.reviseCount) || 0,
    reviseByHouse: {
      ...emptyReviseByHouse(),
      ...(state.reviseByHouse ?? {}),
    },
    verdict: state.verdict ?? null,
  };
  localStorage.setItem(KEY, JSON.stringify(snapshot));
}

export function clearState() {
  localStorage.removeItem(KEY);
}
