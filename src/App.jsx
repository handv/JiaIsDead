import { useEffect, useMemo, useState } from "react";
import batch1 from "./data/batch1.json";
import evidenceList from "./data/evidence.json";
import peopleData from "./data/people.json";
import searchEntries from "./data/searches.json";
import { collectUnlocks, search } from "./game/search.js";
import { scoreBatch } from "./game/scoreBatch.js";
import { clearState, loadState, saveState } from "./game/storage.js";
import { catalogLabels, collectPeople, peopleInUnlockOrder } from "./game/unlock.js";
import Desk from "./ui/Desk.jsx";
import DocumentView from "./ui/Document.jsx";
import FamilyTree from "./ui/FamilyTree.jsx";
import SearchApp from "./ui/SearchApp.jsx";

const starterIds = evidenceList.filter((item) => item.onDesk).map((item) => item.id);
const roster = [...peopleData.people, ...peopleData.decoys];
const clickTerms = [
  ...new Set(searchEntries.flatMap((entry) => entry.terms)),
].sort((a, b) => b.length - a.length);

function emptyPlacements() {
  const next = {};
  for (const slot of batch1.slots) {
    next[slot.id] = { personId: "", role: "" };
  }
  return next;
}

export default function App() {
  const saved = useMemo(() => loadState(), []);
  const [screen, setScreen] = useState("desk");
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [unlockedIds, setUnlockedIds] = useState(
    saved?.unlockedIds ?? starterIds,
  );
  const [unlockedPersonIds, setUnlockedPersonIds] = useState(
    saved?.unlockedPersonIds ?? [],
  );
  const [placements, setPlacements] = useState(
    saved?.placements ?? emptyPlacements(),
  );
  const [batch1Locked, setBatch1Locked] = useState(
    Boolean(saved?.batch1Locked),
  );

  const unlocked = evidenceList.filter((item) => unlockedIds.includes(item.id));
  const openDoc = evidenceList.find((item) => item.id === openId) ?? null;
  const placedIds = Object.values(placements)
    .map((item) => item.personId)
    .filter(Boolean);
  const nameOptions = peopleInUnlockOrder(
    roster,
    unlockedPersonIds,
    placedIds,
  );
  const roleOptions = [...new Set(roster.map((person) => person.role))];
  const lastCatalog =
    searchResult?.status === "ok"
      ? catalogLabels(searchResult.hits, roster)
      : { names: [], roles: [] };

  useEffect(() => {
    saveState({
      unlockedIds,
      unlockedPersonIds,
      placements,
      batch1Locked,
    });
  }, [unlockedIds, unlockedPersonIds, placements, batch1Locked]);

  function openDocument(id) {
    setOpenId(id);
    setScreen("document");
  }

  function runSearch(raw) {
    const nextQuery = raw ?? query;
    setQuery(nextQuery);
    const result = search(nextQuery, searchEntries);
    setSearchResult(result);
    if (result.status === "ok") {
      const extraDocs = collectUnlocks(result.hits);
      const extraPeople = collectPeople(result.hits);
      if (extraDocs.length) {
        setUnlockedIds((current) => [...new Set([...current, ...extraDocs])]);
      }
      if (extraPeople.length) {
        setUnlockedPersonIds((current) => [
          ...new Set([...current, ...extraPeople]),
        ]);
      }
    }
    setScreen("search");
  }

  function setSlot(slotId, field, value) {
    if (batch1Locked) return;
    setSubmitResult(null);
    setPlacements((current) => ({
      ...current,
      [slotId]: { ...current[slotId], [field]: value },
    }));
  }

  function submitBatch() {
    const result = scoreBatch(placements, batch1.slots);
    setSubmitResult(result);
    if (result.ok) setBatch1Locked(true);
  }

  function resetCase() {
    clearState();
    setUnlockedIds(starterIds);
    setUnlockedPersonIds([]);
    setPlacements(emptyPlacements());
    setBatch1Locked(false);
    setSubmitResult(null);
    setSearchResult(null);
    setQuery("");
    setOpenId(null);
    setScreen("desk");
  }

  return (
    <div className="shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">户部清查 · 抄家之后</p>
          <h1>贾氏两府清查案</h1>
        </div>
        <p className="seal">{batch1Locked ? "骨架已钤" : "第一批未核"}</p>
      </header>

      <nav className="tabs">
        <button
          className={screen === "desk" || screen === "document" ? "active" : ""}
          onClick={() => setScreen("desk")}
          type="button"
        >
          书桌
        </button>
        <button
          className={screen === "search" ? "active" : ""}
          onClick={() => setScreen("search")}
          type="button"
        >
          缙绅录
        </button>
        <button
          className={screen === "tree" ? "active" : ""}
          onClick={() => setScreen("tree")}
          type="button"
        >
          族谱
        </button>
        <button className="ghost" onClick={resetCase} type="button">
          清档
        </button>
      </nav>

      {screen === "desk" ? (
        <Desk items={unlocked} onOpen={openDocument} locked={batch1Locked} />
      ) : null}
      {screen === "document" && openDoc ? (
        <DocumentView
          doc={openDoc}
          terms={clickTerms}
          onBack={() => setScreen("desk")}
          onSearch={runSearch}
        />
      ) : null}
      {screen === "search" ? (
        <SearchApp
          query={query}
          onQuery={setQuery}
          onSearch={() => runSearch()}
          result={searchResult}
          catalog={lastCatalog}
          onOpen={openDocument}
        />
      ) : null}
      {screen === "tree" ? (
        <FamilyTree
          slots={batch1.slots}
          placements={placements}
          names={nameOptions}
          roles={roleOptions}
          locked={batch1Locked}
          submitResult={submitResult}
          onChange={setSlot}
          onSubmit={submitBatch}
        />
      ) : null}
    </div>
  );
}
