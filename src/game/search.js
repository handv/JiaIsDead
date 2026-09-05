export function normalizeQuery(query) {
  return String(query ?? "").replace(/\s+/g, "").trim();
}

export function entriesInSource(entries, sourceId) {
  if (!sourceId) return [];
  return entries.filter((entry) => entry.source === sourceId);
}

export function availableSources(sourceList, lockedCount) {
  const count = Number(lockedCount) || 0;
  return sourceList.filter((item) => (item.unlockAt ?? 0) <= count);
}

export function sourcesOpenedAt(sourceList, count) {
  const n = Number(count) || 0;
  if (n <= 0) return [];
  return sourceList.filter((item) => (item.unlockAt ?? 0) === n);
}

export function search(query, entries) {
  const q = normalizeQuery(query);
  if (q.length < 2) {
    return { status: "short", hits: [] };
  }

  const hits = entries.filter((entry) =>
    entry.terms.some((term) => q.includes(term) || term.includes(q)),
  );

  if (hits.length === 0) {
    return { status: "empty", hits: [] };
  }

  return { status: "ok", hits };
}

export function collectUnlocks(hits) {
  return [
    ...new Set(hits.map((hit) => hit.unlocksEvidenceId).filter(Boolean)),
  ];
}
