const KEY = "jia-clan-v16";

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
  };
  localStorage.setItem(KEY, JSON.stringify(snapshot));
}

export function clearState() {
  localStorage.removeItem(KEY);
}
