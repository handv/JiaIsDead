export function scoreBatch(placements, slots) {
  const incomplete = slots.some((slot) => {
    const placed = placements[slot.id];
    return !placed?.personId || !placed?.role;
  });

  if (incomplete) {
    return { ok: false, reason: "incomplete" };
  }

  const ok = slots.every((slot) => {
    const placed = placements[slot.id];
    return placed.personId === slot.personId && placed.role === slot.role;
  });

  return { ok, reason: ok ? "lock" : "mismatch" };
}

export function isSlotCorrect(placement, slot) {
  return (
    placement?.personId === slot.personId && placement?.role === slot.role
  );
}

export const CLUE_AT = [
  { count: 3, evidenceId: "E05" },
  { count: 6, evidenceId: "E07" },
  { count: 9, evidenceId: "E31" },
  { count: 12, evidenceId: "E45" },
];

export function cluesForLockCount(count) {
  return CLUE_AT.filter((item) => count >= item.count).map(
    (item) => item.evidenceId,
  );
}

export function latestClueGrant(count) {
  const n = Number(count) || 0;
  return [...CLUE_AT].reverse().find((item) => n >= item.count) ?? null;
}

export function clueGrantedExactlyAt(count) {
  const n = Number(count) || 0;
  return CLUE_AT.find((item) => item.count === n) ?? null;
}

export function buildClueNotice({
  lockedCount,
  caseClosed = false,
  titleById = {},
  archiveTitles = [],
}) {
  if (caseClosed) {
    return {
      kind: "closed",
      text: "全案已核。昭穆已定。",
      evidenceId: null,
      title: null,
      fresh: false,
    };
  }

  const n = Number(lockedCount) || 0;
  const exact = clueGrantedExactlyAt(n);
  const latest = latestClueGrant(n);
  const title = latest ? (titleById[latest.evidenceId] ?? null) : null;

  if (exact && title) {
    const archiveBit = archiveTitles.length
      ? `档册新开${archiveTitles.join("、")}。`
      : "";
    return {
      kind: "fresh",
      text: `对满三格。新发下：${title}。${archiveBit}`,
      evidenceId: exact.evidenceId,
      title,
      fresh: true,
    };
  }

  if (latest && title) {
    return {
      kind: "held",
      text: `已核 ${n} 格。已发：${title}。`,
      evidenceId: latest.evidenceId,
      title,
      fresh: false,
    };
  }

  if (n > 0) {
    return {
      kind: "progress",
      text: `已核 ${n} 格。再凑满三格一并核认。`,
      evidenceId: null,
      title: null,
      fresh: false,
    };
  }

  return {
    kind: "idle",
    text: null,
    evidenceId: null,
    title: null,
    fresh: false,
  };
}

export function collectCorrectSlotIds(placements, slots) {
  return slots
    .filter((slot) => isSlotCorrect(placements[slot.id], slot))
    .map((slot) => slot.id);
}

export const LOCK_BATCH = 3;

export function pendingCorrectSlotIds(placements, slots, lockedSlotIds = []) {
  const locked = new Set(lockedSlotIds);
  return slots
    .filter(
      (slot) => !locked.has(slot.id) && isSlotCorrect(placements[slot.id], slot),
    )
    .map((slot) => slot.id);
}

export function nextVerifiedIds(
  placements,
  slots,
  lockedSlotIds = [],
  batchSize = LOCK_BATCH,
) {
  const pending = pendingCorrectSlotIds(placements, slots, lockedSlotIds);
  if (pending.length >= batchSize) {
    return pending.slice(0, batchSize);
  }
  const unlockedLeft = slots.filter((slot) => !lockedSlotIds.includes(slot.id));
  if (
    pending.length > 0 &&
    pending.length === unlockedLeft.length &&
    pending.length < batchSize
  ) {
    return pending;
  }
  return [];
}
