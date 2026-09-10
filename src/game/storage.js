const KEY = "jia-clan-v17";

export function emptyReviseByHouse() {
  return { ning: 0, rong: 0, kin: 0 };
}

export function playScreenOf(screen) {
  if (screen === "search" || screen === "tree") return screen;
  if (screen === "desk" || screen === "document") return "desk";
  return null;
}

export function hasProgress(state, starterIds = []) {
  if (!state) return false;
  if (state.verdict) return true;
  if (state.lockedSlotIds?.length) return true;
  if (state.unlockedPersonIds?.length) return true;
  if ((Number(state.searchCount) || 0) > 0) return true;
  if (state.searchHistory?.length) return true;
  if (Object.values(state.placements ?? {}).some((item) => item?.personId || item?.role)) {
    return true;
  }
  return (state.unlockedIds ?? []).some((id) => !starterIds.includes(id));
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
    lastScreen: playScreenOf(state.lastScreen) ?? "desk",
  };
  localStorage.setItem(KEY, JSON.stringify(snapshot));
}

export function clearState() {
  localStorage.removeItem(KEY);
}
