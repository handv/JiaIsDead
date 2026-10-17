export function jiaMatchesFoundDocument(doc, query) {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return true;
  return [doc.title || "", ...(doc.body || [])].some((text) =>
    text.toLocaleLowerCase().includes(term),
  );
}

export function jiaUniqueSearchHits(result, readIds) {
  if (result?.status !== "ok") return result;
  const seen = new Set();
  const hits = result.hits.filter((hit) => {
    const id = hit.unlocksEvidenceId || hit.id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  const read = new Set(readIds);
  return {
    ...result,
    hits: hits.sort(
      (a, b) =>
        Number(read.has(a.unlocksEvidenceId)) -
        Number(read.has(b.unlocksEvidenceId)),
    ),
  };
}

// The original archive entries are the source of truth. A paper may have several
// search entries; keep one copy and retain its other archive references.
export function jiaGroupFoundDocuments(documents, sources, entries, readIds) {
  const read = new Set(readIds);
  const seen = new Set();
  const groups = new Map();
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const references = new Map();
  const addReference = (docId, sourceId) => {
    if (!sourceById.has(sourceId)) return;
    if (!references.has(docId)) references.set(docId, []);
    const ids = references.get(docId);
    if (!ids.includes(sourceId)) ids.push(sourceId);
  };
  for (const source of sources) {
    for (const id of source.paperIds || []) addReference(id, source.id);
  }
  for (const entry of entries) {
    addReference(entry.unlocksEvidenceId, entry.source);
  }
  for (const doc of documents) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);
    const ids = references.get(doc.id) || [];
    const id = ids[0] || "loose-papers";
    if (!groups.has(id)) {
      groups.set(id, {
        id,
        title: sourceById.get(id)?.title || "散存案卷",
        documents: [],
        unread: 0,
      });
    }
    const group = groups.get(id);
    group.documents.push({
      ...doc,
      otherArchives: ids.slice(1).map((sid) => sourceById.get(sid).title),
    });
    if (!read.has(doc.id)) group.unread++;
  }
  const order = ["loose-papers", ...sources.map((source) => source.id)];
  return [...groups.values()]
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    .map((group) => ({
      ...group,
      documents: group.documents.sort(
        (a, b) => Number(read.has(a.id)) - Number(read.has(b.id)),
      ),
    }));
}

export function jiaPaperFanRows(documents, compact) {
  const columns = compact ? 1 : 3;
  const rows = [];
  for (let i = 0; i < documents.length; i += columns) {
    rows.push(documents.slice(i, i + columns));
  }
  return rows;
}

// Use only search aliases already visible in the document; never reveal hidden names.
export function jiaPersonChecks(doc, entries, registeredIds, sources) {
  const text = (doc.body || []).join("\n");
  const available = new Set(sources.map((source) => source.id));
  const registered = new Set(registeredIds);
  const clueTerms = new Set([
    "袭了一等",
    "敏逝",
    "保龄侯",
    "威烈那一爵",
    "威烈",
    "捐过官",
    "孀居",
  ]);
  const people = new Map();
  for (const entry of entries) {
    const terms = entry.terms.filter(
      (term) => !clueTerms.has(term) && text.includes(term),
    );
    if (!terms.length) continue;
    const term = terms.sort((a, b) => b.length - a.length)[0];
    for (const personId of entry.unlocksPeople || []) {
      // 匾额 (place-*) stay underline-only; 雅号 (hao-*) get 入档 / 提及 like names.
      if (personId.startsWith("place-")) continue;
      const candidate = {
        personId,
        term,
        sourceId: entry.source,
        available: available.has(entry.source),
        registered: registered.has(personId),
      };
      const previous = people.get(personId);
      if (
        !previous ||
        (candidate.available && !previous.available) ||
        (candidate.available === previous.available &&
          term.length > previous.term.length)
      ) {
        people.set(personId, candidate);
      }
    }
  }
  return [...people.values()];
}

export function jiaDocPeopleComplete(doc, entries, registeredIds, sources) {
  const checks = jiaPersonChecks(doc, entries, registeredIds, sources);
  return checks.length > 0 && checks.every((check) => check.registered);
}

export function jiaPeopleCompleteIds(documents, entries, registeredIds, sources) {
  return documents
    .filter((doc) =>
      jiaDocPeopleComplete(doc, entries, registeredIds, sources),
    )
    .map((doc) => doc.id);
}
