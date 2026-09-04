export function collectPeople(hits) {
  return [
    ...new Set(hits.flatMap((hit) => hit.unlocksPeople ?? [])),
  ];
}

export function collectRoles(hits) {
  return [
    ...new Set(hits.flatMap((hit) => hit.unlocksRoles ?? [])),
  ];
}

export function peopleInUnlockOrder(roster, unlockedPersonIds, placedIds = []) {
  const byId = new Map(roster.map((person) => [person.id, person]));
  const seen = new Set();
  const result = [];
  for (const id of [...unlockedPersonIds, ...placedIds]) {
    const person = byId.get(id);
    if (!person || seen.has(id)) continue;
    seen.add(id);
    result.push(person);
  }
  return result;
}

export function catalogLabels(hits, roster) {
  const ids = collectPeople(hits);
  const byId = new Map(roster.map((person) => [person.id, person]));
  return {
    names: ids.map((id) => byId.get(id)?.name).filter(Boolean),
    roles: collectRoles(hits),
  };
}
