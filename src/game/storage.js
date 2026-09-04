const KEY = "jia-clan-v9";

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
    batch1Locked: state.batch1Locked,
    batch2Locked: state.batch2Locked,
    batch3Locked: state.batch3Locked,
  };
  localStorage.setItem(KEY, JSON.stringify(snapshot));
}

export function clearState() {
  localStorage.removeItem(KEY);
}
