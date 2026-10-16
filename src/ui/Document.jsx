import { useEffect, useState } from "react";
import { jiaPersonChecks } from "./workspace/utils.js";

function TermButton({ term, docId, onSearch, filed = false }) {
  const [excerpted, setExcerpted] = useState(() =>
    Boolean(window.jiaEnhancer?.isExcerpted(docId, term)),
  );

  function refreshExcerpted() {
    setExcerpted(Boolean(window.jiaEnhancer?.isExcerpted(docId, term)));
  }

  useEffect(() => {
    const sync = () => refreshExcerpted();
    window.addEventListener("jia-excerpts", sync);
    return () => window.removeEventListener("jia-excerpts", sync);
  }, [docId, term]);

  const className = [
    "term",
    excerpted ? "is-excerpted" : "",
    filed ? "is-filed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className="jia-term-wrap">
      <span
        className={className}
        role="button"
        tabIndex={0}
        title={filed ? "已入档 · 单击带到档册" : "单击带到档册"}
        onClick={(event) => {
          if (window.jiaEnhancer?.isDragging(event)) return;
          event.preventDefault();
          window.jiaEnhancer?.hideToolbar?.();
          onSearch(term);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          onSearch(term);
        }}
      >
        {term}
      </span>
      <button
        type="button"
        className="jia-excerpt-mark"
        aria-label={excerpted ? `${term}已在摘录` : `摘录${term}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          window.jiaEnhancer?.hideToolbar?.();
          window.jiaEnhancer?.capture(term, docId, event);
          refreshExcerpted();
        }}
      >
        摘
      </button>
    </span>
  );
}

function decorate(text, terms, onSearch, docId, filedTerms, usedTerms) {
  const sorted = [...new Set(terms)].sort((a, b) => b.length - a.length);
  const parts = [];
  let rest = text;

  while (rest.length) {
    let hit = null;
    let index = -1;
    for (const term of sorted) {
      // One underline per term per paper; later repeats stay plain text.
      if (usedTerms.has(term)) continue;
      const at = rest.indexOf(term);
      if (at !== -1 && (index === -1 || at < index)) {
        hit = term;
        index = at;
      }
    }
    if (!hit) {
      parts.push(rest);
      break;
    }
    if (index > 0) parts.push(rest.slice(0, index));
    usedTerms.add(hit);
    parts.push(
      <TermButton
        key={`${hit}-${parts.length}`}
        term={hit}
        docId={docId}
        onSearch={onSearch}
        filed={filedTerms.has(hit)}
      />,
    );
    rest = rest.slice(index + hit.length);
  }

  return parts;
}

const LETTER_KINDS = new Set(["书信", "家书", "手札", "遗言", "请帖"]);
const DATED_KINDS = new Set([
  "书信",
  "家书",
  "手札",
  "遗言",
  "日记",
  "请帖",
  "抄录",
  "登记",
]);

function paraClass(kind, index, total) {
  if (!DATED_KINDS.has(kind) || total < 2) return undefined;
  if (index === total - 1) return "letter-date";
  if (index === total - 2) return "letter-from";
  if (LETTER_KINDS.has(kind) && index === 0) return "letter-open";
  return "letter-body";
}

export default function DocumentView({
  doc,
  terms,
  onBack,
  onSearch,
  backLabel = "回到书桌",
  hint = "单击查档；点「摘」收入摘录。虚线为已摘录，细浪线为已入档。",
  allowSearch = true,
  personEntries = [],
  registeredPersonIds = [],
  availableSources = [],
}) {
  const personChecks = jiaPersonChecks(
    doc,
    personEntries,
    registeredPersonIds,
    availableSources,
  );
  const total = doc.body.length;
  const searchTerms = allowSearch
    ? [...new Set([...terms, ...personChecks.map((check) => check.term)])]
    : [];
  const filedTerms = new Set(
    personChecks.filter((check) => check.registered).map((check) => check.term),
  );
  const usedTerms = new Set();
  return (
    <article className="panel document" data-jia-doc={doc.id}>
      <button className="text-btn" onClick={onBack} type="button">
        {backLabel}
      </button>
      <p className="kind">{doc.kind}</p>
      <h2>{doc.title}</h2>
      {doc.body.map((para, index) => (
        <p
          key={`${index}-${para.slice(0, 24)}`}
          className={paraClass(doc.kind, index, total)}
          data-jia-paragraph={index}
        >
          {decorate(
            para,
            searchTerms,
            onSearch,
            doc.id,
            filedTerms,
            usedTerms,
          )}
        </p>
      ))}
      {hint ? <p className="hint">{hint}</p> : null}
    </article>
  );
}
