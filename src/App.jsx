import { useEffect, useMemo, useState } from "react";
import batch1 from "./data/batch1.json";
import batch2 from "./data/batch2.json";
import batch3 from "./data/batch3.json";
import batch4 from "./data/batch4.json";
import batch5 from "./data/batch5.json";
import evidenceList from "./data/evidence.json";
import peopleData from "./data/people.json";
import roleLexicon from "./data/roles.json";
import searchEntries from "./data/searches.json";
import sources from "./data/sources.json";
import { availableSources, collectUnlocks, entriesInSource, search, sourcesOpenedAt } from "./game/search.js";
import { buildClueNotice, cluesForLockCount, nextVerifiedIds } from "./game/scoreBatch.js";
import { clearState, loadState, saveState } from "./game/storage.js";
import { catalogLabels, collectPeople, peopleInUnlockOrder } from "./game/unlock.js";
import Desk from "./ui/Desk.jsx";
import DocumentView from "./ui/Document.jsx";
import EvidenceIndex from "./ui/EvidenceIndex.jsx";
import FamilyTree from "./ui/FamilyTree.jsx";
import SearchApp from "./ui/SearchApp.jsx";

const SHOW_ALL_EVIDENCE = false;
const starterIds = SHOW_ALL_EVIDENCE
  ? evidenceList.map((item) => item.id)
  : evidenceList.filter((item) => item.onDesk).map((item) => item.id);
const roster = [...peopleData.people, ...peopleData.decoys];
const REVEAL_ALL_NAMES = false;
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
const allSlots = [
  ...batch1.slots,
  ...batch2.slots,
  ...batch3.slots,
  ...batch4.slots,
  ...batch5.slots,
];

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
  const [sourceId, setSourceId] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [unlockedIds, setUnlockedIds] = useState(
    SHOW_ALL_EVIDENCE ? starterIds : (saved?.unlockedIds ?? starterIds),
  );
  const [unlockedPersonIds, setUnlockedPersonIds] = useState(
    saved?.unlockedPersonIds ?? [],
  );
  const [placements, setPlacements] = useState(
    mergePlacements(saved?.placements),
  );
  const [lockedSlotIds, setLockedSlotIds] = useState(
    saved?.lockedSlotIds ?? [],
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
      lockedSlotIds,
    });
  }, [unlockedIds, unlockedPersonIds, placements, lockedSlotIds]);

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

  function applySearchResult(result) {
    setSearchResult(result);
    if (result.status !== "ok") return;
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

  function goSearch(raw, fromDocId) {
    setQuery(raw ?? query);
    if (fromDocId) setSearchFromId(fromDocId);
    setSearchResult(null);
    setScreen("search");
  }

  function runSearch(raw) {
    const nextQuery = raw ?? query;
    setQuery(nextQuery);
    if (!activeSourceId) {
      setSearchResult({ status: "nosource", hits: [] });
      setScreen("search");
      return;
    }
    applySearchResult(
      search(nextQuery, entriesInSource(searchEntries, activeSourceId)),
    );
    setScreen("search");
  }

  function setSlot(slotId, field, value) {
    if (lockedSlotIds.includes(slotId)) return;
    const slot = allSlots.find((item) => item.id === slotId);
    if (!slot) return;
    const nextPlacement = { ...placements[slotId], [field]: value };
    const nextPlacements = {
      ...placements,
      [slotId]: nextPlacement,
    };
    setPlacements(nextPlacements);
    const verified = nextVerifiedIds(nextPlacements, allSlots, lockedSlotIds);
    if (!verified.length) return;
    const nextLocked = [...lockedSlotIds, ...verified];
    setLockedSlotIds(nextLocked);
    const clues = cluesForLockCount(nextLocked.length);
    if (clues.length) {
      setUnlockedIds((current) => [...new Set([...current, ...clues])]);
    }
  }

  function resetCase() {
    clearState();
    setUnlockedIds(starterIds);
    setUnlockedPersonIds([]);
    setPlacements(emptyPlacements());
    setLockedSlotIds([]);
    setSearchResult(null);
    setQuery("");
    setSourceId(null);
    setOpenId(null);
    setSearchFromId(null);
    setScreen("desk");
  }

  const lockedCount = lockedSlotIds.length;
  const openSources = availableSources(sources, lockedCount);
  const activeSourceId = openSources.some((item) => item.id === sourceId)
    ? sourceId
    : null;
  const caseClosed = lockedCount >= allSlots.length;
  const titleById = Object.fromEntries(
    evidenceList.map((item) => [item.id, item.title]),
  );
  const clueNotice = SHOW_ALL_EVIDENCE
    ? { text: "", fresh: false, evidenceId: null, title: "" }
    : buildClueNotice({
        lockedCount,
        caseClosed,
        titleById,
        archiveTitles: sourcesOpenedAt(sources, lockedCount).map((item) => item.title),
      });
  const seal = SHOW_ALL_EVIDENCE
    ? `检阅全卷 · ${evidenceList.length} 纸`
    : caseClosed
      ? "全案已核"
      : clueNotice.fresh
        ? `已核 ${lockedCount} 格 · 新发${clueNotice.title}`
        : clueNotice.title
          ? `已核 ${lockedCount} 格 · 已发${clueNotice.title}`
          : lockedCount > 0
            ? `已核 ${lockedCount} 格`
            : "尚未核格";

  function openCluePaper(docId) {
    if (!docId) return;
    setOpenId(docId);
    setSearchFromId(null);
    setScreen("document");
  }

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
          档册
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

      {screen === "desk" || (screen === "document" && openDoc) ? (
        <div className="desk-with-index">
          <EvidenceIndex
            items={unlocked}
            activeId={screen === "document" ? openId : null}
            freshId={
              SHOW_ALL_EVIDENCE
                ? null
                : clueNotice?.fresh
                  ? clueNotice.evidenceId
                  : null
            }
            onOpen={openDocument}
          />
          <div className="desk-main">
            {screen === "desk" ? (
              <Desk
                items={unlocked}
                onOpen={openDocument}
                caseClosed={caseClosed}
                clueNotice={clueNotice}
              />
            ) : (
              <DocumentView
                doc={openDoc}
                terms={termsForDocument(openDoc.id)}
                onBack={closeDocument}
                onSearch={(term) => goSearch(term, openId)}
              />
            )}
          </div>
        </div>
      ) : null}
      {screen === "search" ? (
        <SearchApp
          sources={openSources}
          sourceId={activeSourceId}
          onSelectSource={(id) => {
            setSourceId(id);
            setSearchResult(null);
          }}
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
          batch4={batch4}
          batch5={batch5}
          placements={placements}
          names={nameOptions}
          roles={roleOptions}
          roleGloss={roleGloss}
          lockedSlotIds={lockedSlotIds}
          lockedCount={lockedCount}
          caseClosed={caseClosed}
          clueNotice={clueNotice}
          onOpenClue={openCluePaper}
          onChange={setSlot}
        />
      ) : null}
    </div>
  );
}
