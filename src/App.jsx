import { useEffect, useMemo, useState } from "react";
import batch1 from "./data/batch1.json";
import batch2 from "./data/batch2.json";
import batch3 from "./data/batch3.json";
import evidenceList from "./data/evidence.json";
import peopleData from "./data/people.json";
import roleLexicon from "./data/roles.json";
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
const REVEAL_ALL_NAMES = true;
function termsForDocument(docId) {
  return [
    ...new Set(
      searchEntries.flatMap((entry) => {
        const addsName = Boolean(entry.unlocksPeople?.length);
        const opensOther =
          entry.unlocksEvidenceId && entry.unlocksEvidenceId !== docId;
        if (!addsName && !opensOther) return [];
        return entry.terms;
      }),
    ),
  ].sort((a, b) => b.length - a.length);
}
const batch1SlotIds = new Set(batch1.slots.map((slot) => slot.id));
const batch2SlotIds = new Set(batch2.slots.map((slot) => slot.id));
const batch3SlotIds = new Set(batch3.slots.map((slot) => slot.id));
const allSlots = [...batch1.slots, ...batch2.slots, ...batch3.slots];

function emptyPlacements() {
  const next = {};
  for (const slot of allSlots) {
    next[slot.id] = { personId: "", role: "" };
  }
  return next;
}

function mergePlacements(saved) {
  return { ...emptyPlacements(), ...(saved ?? {}) };
}

export default function App() {
  const saved = useMemo(() => loadState(), []);
  const [screen, setScreen] = useState("desk");
  const [openId, setOpenId] = useState(null);
  const [searchFromId, setSearchFromId] = useState(null);
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
    mergePlacements(saved?.placements),
  );
  const [batch1Locked, setBatch1Locked] = useState(
    Boolean(saved?.batch1Locked),
  );
  const [batch2Locked, setBatch2Locked] = useState(
    Boolean(saved?.batch2Locked),
  );
  const [batch3Locked, setBatch3Locked] = useState(
    Boolean(saved?.batch3Locked),
  );

  const unlocked = evidenceList.filter((item) => unlockedIds.includes(item.id));
  const openDoc = evidenceList.find((item) => item.id === openId) ?? null;
  const searchFromDoc =
    evidenceList.find((item) => item.id === searchFromId) ?? null;
  const placedIds = Object.values(placements)
    .map((item) => item.personId)
    .filter(Boolean);
  const nameOptions = REVEAL_ALL_NAMES
    ? roster
    : peopleInUnlockOrder(roster, unlockedPersonIds, placedIds);
  const roleOptions = [...new Set(roster.map((person) => person.role))];
  const roleGloss = Object.fromEntries(
    roleLexicon.map((item) => [item.id, item.gloss]),
  );
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
      batch2Locked,
      batch3Locked,
    });
  }, [
    unlockedIds,
    unlockedPersonIds,
    placements,
    batch1Locked,
    batch2Locked,
    batch3Locked,
  ]);

  function openDocument(id) {
    setOpenId(id);
    setScreen("document");
  }

  function goDesk() {
    if (openId && evidenceList.some((item) => item.id === openId)) {
      setScreen("document");
      return;
    }
    setScreen("desk");
  }

  function closeDocument() {
    setOpenId(null);
    setScreen("desk");
  }

  function runSearch(raw, fromDocId) {
    const nextQuery = raw ?? query;
    setQuery(nextQuery);
    const result = search(nextQuery, searchEntries);
    setSearchResult(result);
    if (fromDocId) setSearchFromId(fromDocId);
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
    if (batch1SlotIds.has(slotId) && batch1Locked) return;
    if (batch2SlotIds.has(slotId) && (!batch1Locked || batch2Locked)) return;
    if (batch3SlotIds.has(slotId) && (!batch2Locked || batch3Locked)) return;
    if (
      !batch1SlotIds.has(slotId) &&
      !batch2SlotIds.has(slotId) &&
      !batch3SlotIds.has(slotId)
    ) {
      return;
    }
    setSubmitResult(null);
    setPlacements((current) => ({
      ...current,
      [slotId]: { ...current[slotId], [field]: value },
    }));
  }

  function submitBatch1() {
    const result = scoreBatch(placements, batch1.slots);
    setSubmitResult({ ...result, batch: 1 });
    if (result.ok) {
      setBatch1Locked(true);
      setUnlockedIds((current) => [...new Set([...current, "E05"])]);
    }
  }

  function submitBatch2() {
    if (!batch1Locked) return;
    const result = scoreBatch(placements, batch2.slots);
    setSubmitResult({ ...result, batch: 2 });
    if (result.ok) {
      setBatch2Locked(true);
      setUnlockedIds((current) => [...new Set([...current, "E07"])]);
    }
  }

  function submitBatch3() {
    if (!batch2Locked) return;
    const result = scoreBatch(placements, batch3.slots);
    setSubmitResult({ ...result, batch: 3 });
    if (result.ok) setBatch3Locked(true);
  }

  function resetCase() {
    clearState();
    setUnlockedIds(starterIds);
    setUnlockedPersonIds([]);
    setPlacements(emptyPlacements());
    setBatch1Locked(false);
    setBatch2Locked(false);
    setBatch3Locked(false);
    setSubmitResult(null);
    setSearchResult(null);
    setQuery("");
    setOpenId(null);
    setSearchFromId(null);
    setScreen("desk");
  }

  const seal = batch3Locked
    ? "玉字已钤"
    : batch2Locked
      ? "联姻已钤 · 玉字未核"
      : batch1Locked
        ? "骨架已钤 · 联姻未核"
        : "第一批未核";

  return (
    <div className="shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">户部清查 · 抄家之后</p>
          <h1>贾氏两府清查案</h1>
        </div>
        <p className="seal">{seal}</p>
      </header>

      <nav className="tabs">
        <button
          className={screen === "desk" || screen === "document" ? "active" : ""}
          onClick={goDesk}
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
        <Desk
          items={unlocked}
          onOpen={openDocument}
          batch1Locked={batch1Locked}
          batch2Locked={batch2Locked}
          batch3Locked={batch3Locked}
        />
      ) : null}
      {screen === "document" && openDoc ? (
        <DocumentView
          doc={openDoc}
          terms={termsForDocument(openDoc.id)}
          onBack={closeDocument}
          onSearch={(term) => runSearch(term, openId)}
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
          returnDoc={searchFromDoc}
          onBackToDoc={() => {
            if (!searchFromId) return;
            setOpenId(searchFromId);
            setScreen("document");
          }}
        />
      ) : null}
      {screen === "tree" ? (
        <FamilyTree
          batch1={batch1}
          batch2={batch2}
          batch3={batch3}
          placements={placements}
          names={nameOptions}
          roles={roleOptions}
          roleGloss={roleGloss}
          batch1Locked={batch1Locked}
          batch2Locked={batch2Locked}
          batch3Locked={batch3Locked}
          submitResult={submitResult}
          onChange={setSlot}
          onSubmit1={submitBatch1}
          onSubmit2={submitBatch2}
          onSubmit3={submitBatch3}
        />
      ) : null}
    </div>
  );
}
