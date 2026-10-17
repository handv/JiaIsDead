import { useEffect, useRef, useState } from "react";
import SearchApp from "../SearchApp.jsx";
import JiaArchiveCards from "./ArchiveCards.jsx";
import JiaDocumentReader from "./DocumentReader.jsx";
import {
  jiaGroupFoundDocuments,
  jiaMatchesFoundDocument,
  jiaUniqueSearchHits,
} from "./utils.js";

export default function JiaCaseWorkspace({
  searchProps,
  documents,
  activeDocument,
  readDocumentIds,
  onOpen,
  onCloseDocument,
  onPrepareSearch,
  readerTerms,
  personEntries,
  registeredPersonIds,
  availableSources,
  clueNotice,
  archiveSources,
  archiveEntries,
  garden = false,
}) {
  const [pane, setPane] = useState("search");
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("all");
  const searchRef = useRef(null);
  const read = new Set(readDocumentIds);
  const result = jiaUniqueSearchHits(searchProps.result, readDocumentIds);
  const hits = result?.status === "ok" ? result.hits : [];
  const pendingHits = hits.filter(
    (hit) => hit.unlocksEvidenceId && !read.has(hit.unlocksEvidenceId),
  );
  const groups = jiaGroupFoundDocuments(
    documents,
    archiveSources,
    archiveEntries,
    readDocumentIds,
  );
  const isVisible = (doc) =>
    jiaMatchesFoundDocument(doc, filter) &&
    (status === "all" ||
      (status === "read" ? read.has(doc.id) : !read.has(doc.id)));
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      visible: group.documents.filter(isVisible),
    }))
    .filter((group) => group.visible.length);
  const unreadCount = documents.filter((doc) => !read.has(doc.id)).length;
  const open = (id) => onOpen(id);

  const prepareSearch = (term, sourceId) => {
    window.dispatchEvent(new Event("jia-close-decks"));
    window.dispatchEvent(new Event("jia-close-tools"));
    window.dispatchEvent(new Event("jia-close-mentions"));
    onCloseDocument();
    onPrepareSearch(term, sourceId);
    setPane("search");
    requestAnimationFrame(() => {
      if (searchRef.current) searchRef.current.scrollTop = 0;
      searchRef.current
        ?.querySelector('input[aria-label="检索"]')
        ?.focus();
    });
  };

  const focusMention = () => {
    const pending = window.jiaMentionFocus;
    if (!pending) return;
    const article = document.querySelector(".jia-document-dialog .document");
    if (article?.dataset.jiaDoc !== pending.docId) return;
    const paragraph = article.querySelector(
      `[data-jia-paragraph="${pending.paragraph}"]`,
    );
    if (!paragraph) return;
    delete window.jiaMentionFocus;
    paragraph.scrollIntoView({ block: "center" });
    paragraph.classList.add("jia-mention-focus");
    setTimeout(() => paragraph.classList.remove("jia-mention-focus"), 2400);
  };

  useEffect(() => {
    const opened = () => requestAnimationFrame(focusMention);
    window.addEventListener("jia-open-document", opened);
    return () => window.removeEventListener("jia-open-document", opened);
  }, []);

  return (
    <section
      className="jia-workspace"
      data-active-pane={pane}
      aria-label="查案工作台"
    >
      <div
        className="jia-workspace-mobile-tabs"
        role="tablist"
        aria-label="工作台分栏"
      >
        {[
          ["search", "档册"],
          ["index", "书桌"],
        ].map(([id, title]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pane === id}
            onClick={() => setPane(id)}
          >
            {title}
          </button>
        ))}
      </div>
      <aside
        className="jia-workspace-pane jia-workspace-search"
        data-pane="search"
        ref={searchRef}
        aria-label="档册检索与结果"
      >
        <div className="jia-search-progress" aria-live="polite">
          <span>
            {hits.length
              ? `本次 ${hits.length} 份 · ${pendingHits.length} 份未查阅`
              : "搜索结果保留在此栏"}
          </span>
          {pendingHits.length ? (
            <button
              type="button"
              onClick={() => open(pendingHits[0].unlocksEvidenceId)}
            >
              下一份未查阅
            </button>
          ) : null}
        </div>
        <SearchApp
          {...searchProps}
          result={result}
          returnDoc={null}
          onOpen={open}
          readDocumentIds={readDocumentIds}
          openedText="案卷已收录到书桌，未读的排在前面。"
          lede={
            garden
              ? "选一匣检索。点击结果在弹窗查阅。"
              : "选一档检索。点击结果在弹窗查阅。"
          }
        />
      </aside>
      <aside
        className="jia-workspace-pane jia-workspace-index"
        data-pane="index"
        aria-label="书桌案卷列表"
      >
        <header className="jia-pane-heading">
          <h2>书桌</h2>
          <span>{`${documents.length} 份案卷`}</span>
        </header>
        <input
          className="jia-paper-filter"
          value={filter}
          aria-label="筛选书桌案卷"
          placeholder="搜索已找到案卷的标题或正文"
          onChange={(event) => setFilter(event.target.value)}
        />
        {clueNotice?.text ? (
          <p className="jia-workspace-notice">{clueNotice.text}</p>
        ) : null}
        <div
          className="jia-paper-status-filter"
          role="group"
          aria-label="案卷查阅状态"
        >
          {[
            ["all", `全部 ${documents.length}`],
            ["unread", `未查阅 ${unreadCount}`],
            ["read", `已读 ${documents.length - unreadCount}`],
          ].map(([id, title]) => (
            <button
              key={id}
              type="button"
              aria-pressed={status === id}
              onClick={() => setStatus(id)}
            >
              {title}
            </button>
          ))}
        </div>
        <JiaArchiveCards
          groups={visibleGroups}
          readDocumentIds={readDocumentIds}
          activeId={activeDocument?.id}
          onOpen={open}
        />
        {!visibleGroups.length ? (
          <p className="jia-pane-caption">
            {filter.trim()
              ? "没有符合关键词和查阅状态的案卷。"
              : status === "unread"
                ? "已找到的案卷都查阅过了。"
                : "这里暂时没有案卷。"}
          </p>
        ) : null}
      </aside>
      {activeDocument ? (
        <JiaDocumentReader
          doc={activeDocument}
          readerTerms={readerTerms}
          personEntries={personEntries}
          registeredPersonIds={registeredPersonIds}
          availableSources={availableSources}
          onClose={onCloseDocument}
          onSearch={prepareSearch}
          focusMention={focusMention}
          pendingHits={pendingHits}
          onNext={() => open(pendingHits[0].unlocksEvidenceId)}
        />
      ) : null}
    </section>
  );
}
