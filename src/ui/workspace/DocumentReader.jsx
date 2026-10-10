import { useEffect, useLayoutEffect, useRef, useState } from "react";
import DocumentView from "../Document.jsx";

export default function JiaDocumentReader({
  doc,
  readerTerms,
  personEntries,
  registeredPersonIds,
  availableSources,
  onClose,
  onSearch,
  focusMention,
  pendingHits,
  onNext,
  hint,
}) {
  const dialogRef = useRef(null);
  const sheetRef = useRef(null);
  const toolHost = useRef(null);
  const closing = useRef(false);
  const closeTimer = useRef(null);
  const [returning, setReturning] = useState(false);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setReturning(true);
    window.jiaSuccess?.paperSound("close");
    window.dispatchEvent(new Event("jia-close-tools"));
    window.dispatchEvent(new Event("jia-close-mentions"));
    const delay = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 200;
    closeTimer.current = setTimeout(onClose, delay);
  };

  // These tools retain their original listeners and saved content. Hosting them
  // in the top modal makes excerpts, notes and name mentions usable while reading.
  useLayoutEffect(() => {
    const tools = Array.from(document.body.children).filter((element) =>
      element.matches(".jia-notes,.jia-toggle,.jia-selection,.jia-toast"),
    );
    for (const element of tools) toolHost.current.append(element);
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      clearTimeout(closeTimer.current);
      for (const element of tools) document.body.append(element);
      dialog.close();
    };
  }, []);

  useEffect(() => {
    if (sheetRef.current) sheetRef.current.scrollTop = 0;
    window.jiaSuccess?.paperSound("open");
    requestAnimationFrame(focusMention);
  }, [doc.id]);

  return (
    <dialog
      ref={dialogRef}
      className={
        returning ? "jia-document-dialog is-returning" : "jia-document-dialog"
      }
      aria-label={`案卷：${doc.title}`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="jia-reader-surface">
        <header className="jia-document-header">
          <span>案卷 · 查阅</span>
          <div className="jia-document-actions">
            {pendingHits.length ? (
              <button type="button" onClick={onNext}>
                下一份未查阅
              </button>
            ) : null}
            <button
              type="button"
              className="jia-document-close"
              aria-label="收回案卷"
              autoFocus
              onClick={close}
            >
              ×
            </button>
          </div>
        </header>
        <section
          className="jia-reader-sheet"
          ref={sheetRef}
          aria-label="案卷正文"
        >
          <DocumentView
            doc={doc}
            terms={readerTerms}
            personEntries={personEntries}
            registeredPersonIds={registeredPersonIds}
            availableSources={availableSources}
            onBack={close}
            backLabel="收回案卷"
            onSearch={onSearch}
            hint={
              hint ||
              "单击查档；悬停可摘录。虚线为已摘录。"
            }
          />
        </section>
      </div>
      <div ref={toolHost} className="jia-reader-tools" />
    </dialog>
  );
}
