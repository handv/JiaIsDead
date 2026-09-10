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
import { buildVerdict, closedLine, houseGroup } from "./game/familiarity.js";
import {
  availableSources,
  collectUnlocks,
  entriesInSource,
  normalizeQuery,
  pushSearchHistory,
  search,
  sourcesOpenedAt,
} from "./game/search.js";
import { buildClueNotice, cluesForLockCount, nextVerifiedIds } from "./game/scoreBatch.js";
import { clearState, emptyReviseByHouse, hasProgress, loadState, playScreenOf, saveState } from "./game/storage.js";
import { catalogLabels, collectPeople, peopleInUnlockOrder } from "./game/unlock.js";
import ClearanceCard from "./ui/ClearanceCard.jsx";
import ConfirmDialog from "./ui/ConfirmDialog.jsx";
import Desk from "./ui/Desk.jsx";
import DocumentView from "./ui/Document.jsx";
import EvidenceIndex from "./ui/EvidenceIndex.jsx";
import FamilyTree from "./ui/FamilyTree.jsx";
import Home from "./ui/Home.jsx";
import SearchApp from "./ui/SearchApp.jsx";

const SHOW_ALL_EVIDENCE = false;
const starterIds = SHOW_ALL_EVIDENCE
  ? evidenceList.map((item) => item.id)
  : evidenceList.filter((item) => item.onDesk).map((item) => item.id);
const roster = [...peopleData.people, ...peopleData.decoys];
const REVEAL_ALL_NAMES = false;
const titledOffices = new Set(["宁国公", "荣国公"]);

function termsForDocument(docId) {
  return [
    ...new Set(
      searchEntries.flatMap((entry) => {
        const addsName = Boolean(entry.unlocksPeople?.length);
        const opensOther =
          entry.unlocksEvidenceId && entry.unlocksEvidenceId !== docId;
        if (!addsName && !opensOther) return [];
        return entry.terms.filter((term) => !roleLexicon.some((item) => item.id === term) || titledOffices.has(term));
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
  const [screen, setScreen] = useState("home");
  const [lastPlayScreen, setLastPlayScreen] = useState(
    playScreenOf(saved?.lastScreen) ?? "desk",
  );
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
  const [searchHistory, setSearchHistory] = useState(
    saved?.searchHistory ?? [],
  );
  const [searchCount, setSearchCount] = useState(saved?.searchCount ?? 0);
  const [reviseCount, setReviseCount] = useState(saved?.reviseCount ?? 0);
  const [reviseByHouse, setReviseByHouse] = useState(
    saved?.reviseByHouse ?? emptyReviseByHouse(),
  );
  const [verdict, setVerdict] = useState(saved?.verdict ?? null);
  const [showClearance, setShowClearance] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

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
      searchHistory,
      searchCount,
      reviseCount,
      reviseByHouse,
      verdict,
      lastScreen: lastPlayScreen,
    });
  }, [
    unlockedIds,
    unlockedPersonIds,
    placements,
    lockedSlotIds,
    searchHistory,
    searchCount,
    reviseCount,
    reviseByHouse,
    verdict,
    lastPlayScreen,
  ]);

  useEffect(() => {
    const play = playScreenOf(screen);
    if (play) setLastPlayScreen(play);
  }, [screen]);

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
    if (normalizeQuery(nextQuery).length >= 2) {
      setSearchCount((current) => current + 1);
    }
    setSearchHistory((current) => pushSearchHistory(current, nextQuery));
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
    const previous = placements[slotId]?.[field];
    if (previous && previous !== value) {
      setReviseCount((current) => current + 1);
      const group = houseGroup(slot.house);
      setReviseByHouse((current) => ({
        ...current,
        [group]: (current[group] || 0) + 1,
      }));
    }
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
    setSearchHistory([]);
    setSearchCount(0);
    setReviseCount(0);
    setReviseByHouse(emptyReviseByHouse());
    setVerdict(null);
    setShowClearance(false);
    setConfirmClear(false);
    setLastPlayScreen("desk");
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

  useEffect(() => {
    if (SHOW_ALL_EVIDENCE || !caseClosed || verdict) return;
    setVerdict(
      buildVerdict({
        searchCount,
        reviseCount,
        paperCount: unlockedIds.length,
        paperTotal: evidenceList.length,
        reviseByHouse,
      }),
    );
    setShowClearance(true);
  }, [caseClosed, verdict, searchCount, reviseCount, unlockedIds.length, reviseByHouse]);

  const clueNotice = SHOW_ALL_EVIDENCE
    ? { text: "", fresh: false, evidenceId: null, title: "" }
    : buildClueNotice({
        lockedCount,
        caseClosed,
        titleById,
        archiveTitles: sourcesOpenedAt(sources, lockedCount).map((item) => item.title),
        closedText: closedLine(verdict),
      });
  const seal = SHOW_ALL_EVIDENCE
    ? `检阅全卷 · ${evidenceList.length} 纸`
    : caseClosed && verdict
      ? `熟悉度 ${verdict.familiarity}%`
      : clueNotice.fresh
        ? `已核 ${lockedCount} 格 · 新发${clueNotice.title}`
        : clueNotice.title
          ? `已核 ${lockedCount} 格 · 已发${clueNotice.title}`
          : lockedCount > 0
            ? `已核 ${lockedCount} 格`
            : "尚未核格";

  const started = hasProgress(
    {
      unlockedIds,
      unlockedPersonIds,
      placements,
      lockedSlotIds,
      searchHistory,
      searchCount,
      verdict,
    },
    starterIds,
  );

  function openCluePaper(docId) {
    if (!docId) return;
    setOpenId(docId);
    setSearchFromId(null);
    setScreen("document");
  }

  return (
    <div className={screen === "home" ? "shell shell-home" : "shell"}>
      {screen === "home" ? (
        <Home
          started={started}
          caseClosed={caseClosed}
          verdict={SHOW_ALL_EVIDENCE ? null : verdict}
          onStart={() => setScreen("desk")}
          onContinue={() => setScreen(lastPlayScreen || "desk")}
          onRestart={() => setConfirmClear(true)}
          onOpenClearance={() => setShowClearance(true)}
        />
      ) : (
        <>
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
        <div className="tabs-end">
          <button type="button" onClick={() => setScreen("home")}>
            封面
          </button>
        </div>
      </nav>
        </>
      )}

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
                closedText={closedLine(verdict)}
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
          history={searchHistory}
          onPickHistory={(term) => runSearch(term)}
          onForgetHistory={(term) =>
            setSearchHistory((current) => current.filter((item) => item !== term))
          }
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
          verdict={SHOW_ALL_EVIDENCE ? null : verdict}
        />
      ) : null}
      {showClearance && !SHOW_ALL_EVIDENCE && verdict ? (
        <ClearanceCard verdict={verdict} onClose={() => setShowClearance(false)} />
      ) : null}
      {confirmClear ? (
        <ConfirmDialog
          title={screen === "home" ? "销案重起" : "清档"}
          body="此案一笔勾销。案卷、族谱与熟悉度都要重起。"
          confirmLabel={screen === "home" ? "确定销案" : "确定清档"}
          onCancel={() => setConfirmClear(false)}
          onConfirm={resetCase}
        />
      ) : null}
    </div>
  );
}
