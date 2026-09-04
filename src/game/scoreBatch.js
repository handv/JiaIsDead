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
