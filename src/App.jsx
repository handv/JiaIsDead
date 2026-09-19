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
import { buildVerdict, closedLine, fieldStamp, reviveVerdict, stampHouse } from "./game/familiarity.js";
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
import {
  clearState,
  emptyReviseByField,
  emptyReviseByHouse,
  hasProgress,
  loadState,
  mainPlayScreenOf,
  playScreenOf,
  saveState,
} from "./game/storage.js";
import { catalogLabels, collectPeople, peopleInUnlockOrder } from "./game/unlock.js";
import {
  GARDEN_MAP,
  allGardenSlots,
  availableGardenSources,
  gardenCluesGrantedAt,
  GARDEN_CLEARANCE,
  gardenRoster,
  gardenSearchEntries,
  gardenSearchTerms,
  gardenSources,
  gardenStarterIds,
  hasGardenProgress,
  lockedCourtCount,
  mergeGardenPlacements,
  mergeGardenUnlockedIds,
  emptyGardenPlacements,
  nextGardenLockIds,
  searchableGardenEntries,
} from "./game/garden.js";
import gardenEvidence from "./data/gardenEvidence.json";
import ClearanceCard from "./ui/ClearanceCard.jsx";
import ConfirmDialog from "./ui/ConfirmDialog.jsx";
import Desk from "./ui/Desk.jsx";
import DocumentView from "./ui/Document.jsx";
import EvidenceIndex from "./ui/EvidenceIndex.jsx";
import FamilyTree from "./ui/FamilyTree.jsx";
import GardenMap from "./ui/GardenMap.jsx";
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
const gardenSlots = allGardenSlots();
const gardenStarterPaperIds = gardenStarterIds(gardenEvidence);
const gardenTitleById = Object.fromEntries(
  gardenEvidence.map((item) => [item.id, item.title]),
);
const allGardenSearchEntries = gardenSearchEntries(gardenEvidence);
const gardenTermList = gardenSearchTerms(allGardenSearchEntries);
const gardenPeopleRoster = gardenRoster();

function gardenPreviewRequested() {
  if (typeof window === "undefined") return false;
  return window.location.hash.replace(/^#/, "") === "garden";
}

function mainCaseClosedFromSave(saved) {
  return (saved?.lockedSlotIds?.length ?? 0) >= allSlots.length;
}

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
  const [screen, setScreen] = useState(() =>
    gardenPreviewRequested() && mainCaseClosedFromSave(saved) ? "garden" : "home",
  );
  const [gardenMode, setGardenMode] = useState(
    () => gardenPreviewRequested() && mainCaseClosedFromSave(saved),
  );
  const [lastPlayScreen, setLastPlayScreen] = useState(
    mainPlayScreenOf(saved?.lastScreen),
  );
  const [openId, setOpenId] = useState(null);
  const [searchFromId, setSearchFromId] = useState(null);
  const [gardenDocFrom, setGardenDocFrom] = useState("desk");
  const [gardenSourceId, setGardenSourceId] = useState(null);
  const [gardenQuery, setGardenQuery] = useState("");
  const [gardenSearchResult, setGardenSearchResult] = useState(null);
  const [gardenSearchHistory, setGardenSearchHistory] = useState(
    saved?.gardenSearchHistory ?? [],
  );
  const [gardenSearchCount, setGardenSearchCount] = useState(
    saved?.gardenSearchCount ?? saved?.gardenSearchHistory?.length ?? 0,
  );
  const [gardenReviseCount, setGardenReviseCount] = useState(
    saved?.gardenReviseCount ?? 0,
  );
  const [gardenUnlockedOptionIds, setGardenUnlockedOptionIds] = useState(
    saved?.gardenUnlockedOptionIds ?? [],
  );
  const [gardenSearchFromId, setGardenSearchFromId] = useState(null);
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
  const [reviseByField, setReviseByField] = useState(
    saved?.reviseByField ?? emptyReviseByField(),
  );
  const [verdict, setVerdict] = useState(() => reviveVerdict(saved));
  const [showClearance, setShowClearance] = useState(false);
  const [showGardenClearance, setShowGardenClearance] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [gardenPlacements, setGardenPlacements] = useState(
    mergeGardenPlacements(saved?.gardenPlacements),
  );
  const [gardenLockedSlotIds, setGardenLockedSlotIds] = useState(
    saved?.gardenLockedSlotIds ?? [],
  );
  const [gardenUnlockedIds, setGardenUnlockedIds] = useState(() =>
    mergeGardenUnlockedIds(
      saved?.gardenUnlockedIds,
      saved?.gardenLockedSlotIds ?? [],
      gardenEvidence,
    ),
  );
  const [gardenClueNotice, setGardenClueNotice] = useState(null);

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
      reviseByField,
      verdict,
      lastScreen: lastPlayScreen,
      gardenPlacements,
      gardenLockedSlotIds,
      gardenUnlockedIds,
      gardenUnlockedOptionIds,
      gardenSearchHistory,
      gardenSearchCount,
      gardenReviseCount,
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
    reviseByField,
    verdict,
    lastPlayScreen,
    gardenPlacements,
    gardenLockedSlotIds,
    gardenUnlockedIds,
    gardenUnlockedOptionIds,
    gardenSearchHistory,
    gardenSearchCount,
    gardenReviseCount,
  ]);

  useEffect(() => {
    if (
      screen === "garden" ||
      screen === "garden-desk" ||
      screen === "garden-document" ||
      screen === "garden-search"
    ) {
      return;
    }
    const play = playScreenOf(screen);
    if (play) setLastPlayScreen(play);
  }, [screen]);

  function openDocument(id) {
    setOpenId(id);
    setScreen("document");
  }

  function goDesk() {
    if (
      gardenOpen &&
      (gardenMode ||
        screen === "garden" ||
        screen === "garden-desk" ||
        screen === "garden-document" ||
        screen === "garden-search")
    ) {
      setScreen("garden-desk");
      return;
    }
    if (openId && evidenceList.some((item) => item.id === openId)) {
      setScreen("document");
      return;
    }
    setScreen("desk");
  }

  function goArchive() {
    if (
      gardenOpen &&
      (gardenMode ||
        screen === "garden-search" ||
        screen === "garden-document" ||
        screen === "garden")
    ) {
      setScreen("garden-search");
      return;
    }
    setScreen("search");
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

  function goGardenSearch(raw, fromDocId) {
    setGardenQuery(raw ?? gardenQuery);
    if (fromDocId) setGardenSearchFromId(fromDocId);
    setGardenSearchResult(null);
    setScreen("garden-search");
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

  function runGardenSearch(raw) {
    const nextQuery = raw ?? gardenQuery;
    setGardenQuery(nextQuery);
    if (normalizeQuery(nextQuery).length >= 2) {
      setGardenSearchCount((current) => current + 1);
    }
    setGardenSearchHistory((current) => pushSearchHistory(current, nextQuery));
    if (!activeGardenSourceId) {
      setGardenSearchResult({ status: "nosource", hits: [] });
      setScreen("garden-search");
      return;
    }
    const result = search(
      nextQuery,
      entriesInSource(
        searchableGardenEntries(allGardenSearchEntries, gardenUnlockedIds),
        activeGardenSourceId,
      ),
    );
    setGardenSearchResult(result);
    if (result.status === "ok") {
      const extra = collectPeople(result.hits);
      if (extra.length) {
        setGardenUnlockedOptionIds((current) => [
          ...new Set([...current, ...extra]),
        ]);
      }
    }
    setScreen("garden-search");
  }

  function setSlot(slotId, field, value) {
    if (lockedSlotIds.includes(slotId)) return;
    const slot = allSlots.find((item) => item.id === slotId);
    if (!slot) return;
    const previous = placements[slotId]?.[field];
    if (previous && previous !== value) {
      setReviseCount((current) => current + 1);
      const group = stampHouse(slot.house);
      setReviseByHouse((current) => ({
        ...current,
        [group]: (current[group] || 0) + 1,
      }));
      const stamp = fieldStamp(field);
      setReviseByField((current) => ({
        ...current,
        [stamp]: (current[stamp] || 0) + 1,
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

  function setGardenSlot(slotId, personId) {
    if (gardenLockedSlotIds.includes(slotId)) return;
    const slot = gardenSlots.find((item) => item.id === slotId);
    if (!slot) return;
    const previous = gardenPlacements[slotId]?.personId;
    if (previous && previous !== personId) {
      setGardenReviseCount((current) => current + 1);
    }
    const nextPlacements = {
      ...gardenPlacements,
      [slotId]: { ...gardenPlacements[slotId], personId },
    };
    setGardenPlacements(nextPlacements);
    const court = GARDEN_MAP.courts.find((item) => item.id === slot.courtId);
    if (!court) return;
    const verified = nextGardenLockIds(
      court,
      nextPlacements,
      gardenLockedSlotIds,
    );
    if (!verified.length) return;
    const prevCount = lockedCourtCount(gardenLockedSlotIds);
    const nextLocked = [...gardenLockedSlotIds, ...verified];
    const nextCount = lockedCourtCount(nextLocked);
    setGardenLockedSlotIds(nextLocked);
    if (nextCount <= prevCount) return;
    const ids = gardenCluesGrantedAt(nextCount);
    if (ids.length) {
      setGardenUnlockedIds((current) => [...new Set([...current, ...ids])]);
      const titles = ids
        .map((id) => gardenTitleById[id])
        .filter(Boolean);
      setGardenClueNotice({
        kind: "fresh",
        fresh: true,
        evidenceId: ids[0],
        text: `此院已核。新发下：${titles.join("、")}。`,
      });
    }
    if (nextCount >= GARDEN_MAP.courts.length) {
      setShowGardenClearance(true);
    }
  }

  function openGarden() {
    if (lockedSlotIds.length < allSlots.length) return;
    setShowClearance(false);
    setGardenMode(true);
    setScreen("garden");
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
    setReviseByField(emptyReviseByField());
    setVerdict(null);
    setShowClearance(false);
    setShowGardenClearance(false);
    setConfirmClear(false);
    setGardenPlacements(emptyGardenPlacements());
    setGardenLockedSlotIds([]);
    setGardenUnlockedIds(gardenStarterPaperIds);
    setGardenClueNotice(null);
    setGardenMode(false);
    setGardenSourceId(null);
    setGardenQuery("");
    setGardenSearchResult(null);
    setGardenSearchHistory([]);
    setGardenSearchCount(0);
    setGardenReviseCount(0);
    setGardenUnlockedOptionIds([]);
    setGardenSearchFromId(null);
    setGardenDocFrom("desk");
    setLastPlayScreen("desk");
    setScreen("desk");
  }

  const lockedCount = lockedSlotIds.length;
  const openSources = availableSources(sources, lockedCount);
  const activeSourceId = openSources.some((item) => item.id === sourceId)
    ? sourceId
    : null;
  const caseClosed = lockedCount >= allSlots.length;
  const gardenLockedCount = gardenLockedSlotIds.length;
  const gardenClosed = gardenLockedCount >= gardenSlots.length;
  const gardenStarted = hasGardenProgress(gardenPlacements, gardenLockedSlotIds);
  const gardenOpen = caseClosed;
  const gardenOpenDoc =
    gardenEvidence.find((item) => item.id === openId) ?? null;
  const unlockedGardenPapers = gardenEvidence.filter((item) =>
    gardenUnlockedIds.includes(item.id),
  );
  const gardenOptionIds = new Set(gardenUnlockedOptionIds);
  const openGardenSources = availableGardenSources(
    gardenSources,
    gardenUnlockedIds,
  );
  const activeGardenSourceId = openGardenSources.some(
    (item) => item.id === gardenSourceId,
  )
    ? gardenSourceId
    : null;
  const lastGardenCatalog =
    gardenSearchResult?.status === "ok"
      ? catalogLabels(gardenSearchResult.hits, gardenPeopleRoster)
      : { names: [], roles: [] };
  const gardenSearchFromDoc =
    gardenEvidence.find((item) => item.id === gardenSearchFromId) ?? null;

  function openGardenDocument(id, from = "desk") {
    if (!id) return;
    setGardenDocFrom(from);
    setOpenId(id);
    setScreen("garden-document");
  }

  function closeGardenDocument() {
    if (gardenDocFrom === "search") {
      setScreen("garden-search");
      return;
    }
    setOpenId(null);
    setScreen("garden-desk");
  }
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
        reviseByField,
      }),
    );
    setShowClearance(true);
  }, [caseClosed, verdict, searchCount, reviseCount, unlockedIds.length, reviseByHouse, reviseByField]);

  useEffect(() => {
    if (caseClosed) return;
    setGardenMode(false);
    setShowGardenClearance(false);
    if (
      screen === "garden" ||
      screen === "garden-desk" ||
      screen === "garden-document" ||
      screen === "garden-search"
    ) {
      setScreen("home");
    }
  }, [caseClosed, screen]);

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
      ? `叙功${verdict.title}`
      : clueNotice.fresh
        ? `已核 ${lockedCount} 格 · 新发${clueNotice.title}`
        : clueNotice.title
          ? `已核 ${lockedCount} 格 · 已发${clueNotice.title}`
          : lockedCount > 0
            ? `已核 ${lockedCount} 格`
            : "尚未核格";
  const gardenSeal = gardenClosed
    ? "园图已核"
    : gardenLockedCount > 0
      ? `园图已核 ${gardenLockedCount} 格`
      : "园图未核";

  const inGarden =
    gardenOpen &&
    (gardenMode ||
      screen === "garden" ||
      screen === "garden-desk" ||
      screen === "garden-document" ||
      screen === "garden-search");

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
          gardenOpen={gardenOpen}
          gardenStarted={gardenStarted}
          gardenClosed={gardenClosed}
          onStart={() => {
            setGardenMode(false);
            setScreen("desk");
          }}
          onContinue={() => {
            setGardenMode(false);
            setScreen(mainPlayScreenOf(lastPlayScreen));
          }}
          onRestart={() => setConfirmClear(true)}
          onOpenClearance={() => setShowClearance(true)}
          onGarden={openGarden}
        />
      ) : (
        <>
      <header className="masthead">
        <div>
          <p className="eyebrow">
            {inGarden ? "锦衣卫清查 · 园中另案" : "锦衣卫清查 · 抄家之后"}
          </p>
          <h1>{inGarden ? "大观园清查案" : "贾氏两府清查案"}</h1>
        </div>
        <p className="seal">{inGarden ? gardenSeal : seal}</p>
      </header>

      <nav className="tabs">
        <button
          className={
            screen === "desk" ||
            screen === "document" ||
            screen === "garden-desk" ||
            (screen === "garden-document" && gardenDocFrom !== "search")
              ? "active"
              : ""
          }
          onClick={goDesk}
          type="button"
        >
          书桌
        </button>
        <button
          className={
            screen === "search" ||
            screen === "garden-search" ||
            (screen === "garden-document" && gardenDocFrom === "search")
              ? "active"
              : ""
          }
          onClick={goArchive}
          type="button"
        >
          档册
        </button>
        {!inGarden ? (
          <button
            className={screen === "tree" ? "active" : ""}
            onClick={() => {
              setGardenMode(false);
              setScreen("tree");
            }}
            type="button"
          >
            族谱
          </button>
        ) : null}
        {inGarden ? (
          <button
            className={screen === "garden" ? "active" : ""}
            onClick={() => {
              setGardenMode(true);
              setScreen("garden");
            }}
            type="button"
          >
            园图
          </button>
        ) : null}
        {inGarden && gardenClosed ? (
          <button
            type="button"
            onClick={() => {
              setGardenMode(true);
              setScreen("garden");
              setShowGardenClearance(true);
            }}
          >
            结案笺
          </button>
        ) : null}
        <div className="tabs-end">
          <button type="button" onClick={() => {
            setGardenMode(false);
            setScreen("home");
          }}>
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
                onOpenTree={() => setScreen("tree")}
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
      {gardenOpen && screen === "garden-search" ? (
        <SearchApp
          sources={openGardenSources}
          sourceId={activeGardenSourceId}
          onSelectSource={(id) => {
            setGardenSourceId(id);
            setGardenSearchResult(null);
          }}
          query={gardenQuery}
          onQuery={setGardenQuery}
          onSearch={() => runGardenSearch()}
          history={gardenSearchHistory}
          onPickHistory={(term) => runGardenSearch(term)}
          onForgetHistory={(term) =>
            setGardenSearchHistory((current) =>
              current.filter((item) => item !== term),
            )
          }
          result={gardenSearchResult}
          catalog={lastGardenCatalog}
          onOpen={(id) => {
            if (!gardenUnlockedIds.includes(id)) return;
            openGardenDocument(id, "search");
          }}
          returnDoc={gardenSearchFromDoc}
          onBackToDoc={() => {
            if (!gardenSearchFromId) return;
            setOpenId(gardenSearchFromId);
            setScreen("garden-document");
          }}
          lede="园中另匣。纸上朱圈的字带到这里，选已发的一匣再核。同一句话换一匣，结果不同。核过的匾额、雅号、丫鬟才进园图。"
          placeholder="晓翠堂 / 蕉下客"
          legend="园中匣档"
          sourceInputName="garden-source"
          nosourceText="先选一匣再检索。"
          shortText="字太少。请写出纸上的原词。"
          emptyText="此匣未载。换一匣再核。"
          openedText="此匣已核。匾额、雅号、丫鬟须点纸上的字检索后才入园图。"
          catalogKind=""
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
      {gardenOpen && screen === "garden" ? (
        <GardenMap
          garden={GARDEN_MAP}
          placements={gardenPlacements}
          lockedSlotIds={gardenLockedSlotIds}
          onChange={setGardenSlot}
          unlockedOptionIds={gardenOptionIds}
          clueNotice={gardenClueNotice}
          onOpenArchive={() => setScreen("garden-desk")}
        />
      ) : null}
      {gardenOpen &&
      (screen === "garden-desk" ||
        (screen === "garden-document" &&
          gardenOpenDoc &&
          gardenDocFrom !== "search")) ? (
        <div className="desk-with-index">
          <EvidenceIndex
            items={unlockedGardenPapers}
            heading="案卷"
            activeId={screen === "garden-document" ? openId : null}
            freshId={gardenClueNotice?.fresh ? gardenClueNotice.evidenceId : null}
            onOpen={openGardenDocument}
          />
          <div className="desk-main">
            {screen === "garden-desk" ? (
              <Desk
                items={unlockedGardenPapers}
                title="公案桌"
                onOpen={openGardenDocument}
                caseClosed={gardenClosed}
                lede={
                  gardenClosed
                    ? "八处都核了。匣中纸页都在这边。"
                    : "开局三纸。每核一院，匣里再拆几封。匾额、雅号、丫鬟点进档册核过才入园图；主人开局可填。"
                }
                clueNotice={
                  gardenClosed
                    ? { text: "园图已核。匣中纸页都在这边。", fresh: true }
                    : gardenClueNotice
                }
              />
            ) : (
              <DocumentView
                doc={gardenOpenDoc}
                terms={gardenTermList}
                allowSearch
                backLabel="回到书桌"
                hint="朱圈的字可点。带到档册里，选一匣再核。核过的匾额、雅号、丫鬟才进园图。"
                onBack={closeGardenDocument}
                onSearch={(term) => goGardenSearch(term, openId)}
              />
            )}
          </div>
        </div>
      ) : null}
      {gardenOpen &&
      screen === "garden-document" &&
      gardenOpenDoc &&
      gardenDocFrom === "search" ? (
        <DocumentView
          doc={gardenOpenDoc}
          terms={gardenTermList}
          allowSearch
          backLabel="回到档册"
          hint="朱圈的字可点。带到档册里，选一匣再核。核过的匾额、雅号、丫鬟才进园图。"
          onBack={closeGardenDocument}
          onSearch={(term) => goGardenSearch(term, openId)}
        />
      ) : null}
      {showClearance && !inGarden && !SHOW_ALL_EVIDENCE && verdict ? (
        <ClearanceCard
          verdict={verdict}
          onClose={() => setShowClearance(false)}
          onOpenGarden={openGarden}
        />
      ) : null}
      {showGardenClearance && inGarden && !SHOW_ALL_EVIDENCE ? (
        <ClearanceCard
          verdict={{
            ...(verdict ??
              buildVerdict({
                searchCount,
                reviseCount,
                paperCount: unlockedIds.length,
                paperTotal: evidenceList.length,
                reviseByHouse,
                reviseByField,
              })),
            roast: GARDEN_CLEARANCE.roast,
            praise: GARDEN_CLEARANCE.praise,
            searchCount: gardenSearchCount,
            reviseCount: gardenReviseCount,
            paperCount: unlockedGardenPapers.length,
            paperTotal: gardenEvidence.length,
          }}
          caseName={GARDEN_CLEARANCE.name}
          kicker={GARDEN_CLEARANCE.kicker}
          foot={GARDEN_CLEARANCE.foot}
          onClose={() => setShowGardenClearance(false)}
        />
      ) : null}
      {confirmClear ? (
        <ConfirmDialog
          title={screen === "home" ? "销案重起" : "清档"}
          body="此案一笔勾销。正案与园案、案卷、族谱、叙功都要重起。"
          confirmLabel={screen === "home" ? "确定销案" : "确定清档"}
          onCancel={() => setConfirmClear(false)}
          onConfirm={resetCase}
        />
      ) : null}
    </div>
  );
}
