export function normalizeQuery(query) {
  return String(query ?? "").replace(/\s+/g, "").trim();
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
