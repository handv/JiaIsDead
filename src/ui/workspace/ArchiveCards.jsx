import { Fragment, useEffect, useRef, useState } from "react";
import { jiaPaperFanRows } from "./utils.js";

export default function JiaArchiveCards({
  groups,
  readDocumentIds,
  activeId,
  onOpen,
}) {
  const [deck, setDeck] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [compact, setCompact] = useState(
    () => matchMedia("(max-width: 900px)").matches,
  );
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const selectionTimer = useRef(null);
  const busy = useRef(false);
  const read = new Set(readDocumentIds);
  // Keep the displayed papers and their order until this category is put away,
  // even when reading a paper changes the unread filter behind it.
  const group = deck;

  const dismiss = (returnFocus = true) => {
    if (returnFocus) window.jiaSuccess?.paperSound("close");
    clearTimeout(selectionTimer.current);
    busy.current = false;
    dialogRef.current?.close();
    setDeck(null);
    setSelectedId(null);
    if (returnFocus) {
      requestAnimationFrame(() =>
        openerRef.current?.focus({ preventScroll: true }),
      );
    }
  };

  useEffect(() => {
    const media = matchMedia("(max-width: 900px)");
    const changed = () => setCompact(media.matches);
    const closeDecks = () => dismiss(false);
    media.addEventListener("change", changed);
    window.addEventListener("jia-close-decks", closeDecks);
    return () => {
      media.removeEventListener("change", changed);
      window.removeEventListener("jia-close-decks", closeDecks);
      clearTimeout(selectionTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!deck) return;
    const dialog = dialogRef.current;
    if (!dialog?.open) dialog?.showModal();
    return () => {
      clearTimeout(selectionTimer.current);
      busy.current = false;
      dialog?.close();
    };
  }, [deck?.id]);

  const showDeck = (id, event) => {
    const found = groups.find((item) => item.id === id);
    if (!found) return;
    openerRef.current = event.currentTarget;
    setSelectedId(null);
    setDeck({ ...found, visible: [...found.visible] });
    window.dispatchEvent(new Event("jia-close-tools"));
    window.dispatchEvent(new Event("jia-close-mentions"));
    window.jiaSuccess?.paperSound("spread");
  };

  const selectPaper = (doc) => {
    if (busy.current) return;
    busy.current = true;
    setSelectedId(doc.id);
    window.jiaSuccess?.paperSound("pick");
    const delay = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 220;
    selectionTimer.current = setTimeout(() => {
      setSelectedId(null);
      busy.current = false;
      onOpen(doc.id);
    }, delay);
  };

  return (
    <Fragment>
      <div className="jia-archive-decks">
        {groups.map((item) => {
          const first = item.visible[0];
          const current = item.visible.some((doc) => doc.id === activeId);
          return (
            <button
              key={item.id}
              type="button"
              className={
                current ? "jia-archive-deck is-current" : "jia-archive-deck"
              }
              data-deck-id={item.id}
              data-paper-id={current ? activeId : undefined}
              aria-pressed={current}
              aria-label={`摊开${item.title}，${item.visible.length}份案卷`}
              onClick={(event) => showDeck(item.id, event)}
            >
              <span className="jia-deck-stack" aria-hidden="true">
                {item.visible.length > 2 ? (
                  <span className="jia-deck-back back-two" />
                ) : null}
                {item.visible.length > 1 ? (
                  <span className="jia-deck-back back-one" />
                ) : null}
                <span className="jia-deck-front">
                  <span className="jia-mini-kind">{first.kind}</span>
                  <span className="jia-mini-title">{first.title}</span>
                  <span className="jia-mini-text">
                    {(first.body || []).join(" ").slice(0, 70)}
                  </span>
                  <span className="jia-mini-seal">{item.visible.length}</span>
                </span>
              </span>
              <span className="jia-deck-title">{item.title}</span>
              <span className="jia-deck-count">
                {`${item.visible.length} 份 · ${item.visible.filter((doc) => !read.has(doc.id)).length} 未读`}
              </span>
            </button>
          );
        })}
      </div>
      {group ? (
        <dialog
          ref={dialogRef}
          className="jia-paper-dialog"
          aria-labelledby="jia-deck-title"
          aria-describedby="jia-deck-hint"
          onCancel={(event) => {
            event.preventDefault();
            dismiss();
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            ) {
              dismiss();
            }
          }}
        >
          <header className="jia-deck-header">
            <div>
              <p className="jia-deck-kicker">书桌 · 案卷摊阅</p>
              <h2 id="jia-deck-title">{group.title}</h2>
            </div>
            <button
              className="jia-deck-close"
              type="button"
              aria-label="收起摊开的案卷"
              autoFocus
              onClick={() => dismiss()}
            >
              ✕
            </button>
          </header>
          <p id="jia-deck-hint" className="jia-deck-hint">
            {`${group.visible.length} 份案卷 · 点一张打开正文，读完点右上角 × 收回。`}
          </p>
          <div
            className={
              selectedId ? "jia-fan-table is-picking" : "jia-fan-table"
            }
          >
            {jiaPaperFanRows(group.visible, compact).map((row, rowIndex) => (
              <div className="jia-fan-row" key={rowIndex}>
                {row.map((doc, column) => {
                  const offset = column - (row.length - 1) / 2;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      className={`jia-fan-card${read.has(doc.id) ? " is-read" : ""}${selectedId === doc.id ? " is-picked" : ""}${activeId === doc.id ? " is-current" : ""}`}
                      data-card-id={doc.id}
                      aria-label={`查阅：${doc.title}${read.has(doc.id) ? "，已读" : "，未读"}`}
                      aria-disabled={!!selectedId}
                      onClick={() => selectPaper(doc)}
                      style={{
                        "--fan-angle": `${offset * 4}deg`,
                        "--fan-y": `${Math.abs(offset) * 7}px`,
                        "--deal-x": `${-offset * 115}%`,
                        "--deal-delay": `${Math.min(rowIndex * 3 + column, 6) * 30}ms`,
                      }}
                    >
                      <span className="jia-card-top">
                        <span>{doc.kind}</span>
                      </span>
                      <span className="jia-card-title">{doc.title}</span>
                      <span className="jia-card-rule" aria-hidden="true" />
                      <span className="jia-card-preview">
                        {(doc.body || []).slice(0, 2).join("\n")}
                      </span>
                      <span className="jia-card-footer">
                        {selectedId === doc.id
                          ? "正在打开"
                          : activeId === doc.id
                            ? "正在查阅"
                            : "点击查阅"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </dialog>
      ) : null}
    </Fragment>
  );
}
