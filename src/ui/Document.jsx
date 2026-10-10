import { Fragment, useEffect, useId, useRef, useState } from "react";
import { jiaPersonChecks } from "./workspace/utils.js";

function TermButton({ term, docId, onSearch }) {
  const [open, setOpen] = useState(false);
  const [excerpted, setExcerpted] = useState(() =>
    Boolean(window.jiaEnhancer?.isExcerpted(docId, term)),
  );
  const wrapRef = useRef(null);
  const openTimer = useRef(0);
  const closeTimer = useRef(0);
  const menuId = useId();
  const copied = Boolean(window.jiaEnhancer?.isCopied(term));

  useEffect(
    () => () => {
      window.clearTimeout(openTimer.current);
      window.clearTimeout(closeTimer.current);
    },
    [],
  );

  function refreshExcerpted() {
    setExcerpted(Boolean(window.jiaEnhancer?.isExcerpted(docId, term)));
  }

  function scheduleOpen() {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => {
      refreshExcerpted();
      setOpen(true);
      window.jiaEnhancer?.hideToolbar?.();
    }, 240);
  }

  function scheduleClose() {
    window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  }

  return (
    <span
      className="jia-term-wrap"
      ref={wrapRef}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <span
        className={`term${excerpted ? " is-excerpted" : ""}${copied ? " is-copied" : ""}`}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title="单击带到档册；悬停可加入摘录"
        onClick={(event) => {
          if (window.jiaEnhancer?.isDragging(event)) return;
          event.preventDefault();
          window.clearTimeout(openTimer.current);
          setOpen(false);
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
      {open ? (
        <span
          className="jia-selection jia-term-menu"
          id={menuId}
          role="menu"
          aria-label="摘录"
          onMouseEnter={() => window.clearTimeout(closeTimer.current)}
          onMouseLeave={scheduleClose}
        >
          <button
            type="button"
            role="menuitem"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              window.jiaEnhancer?.capture(term, docId, event);
              refreshExcerpted();
              setOpen(false);
            }}
          >
            {excerpted ? "已在摘录" : "加入摘录"}
          </button>
        </span>
      ) : null}
    </span>
  );
}

function jiaPersonTerm(term, docId, onSearch, checks, key) {
  const excerpt = (
    <TermButton term={term} docId={docId} onSearch={onSearch} />
  );
  const person = checks.find((check) => check.term === term);
  if (!person) return <Fragment key={key}>{excerpt}</Fragment>;
  const action = person.registered ? (
    <button
      className="jia-person-registered jia-person-mentions"
      data-label="已入档 · 查看提及"
      aria-label={`查看提及：${term}`}
      type="button"
      title="查看已找到案卷里提到这个名字的原文"
      onClick={(event) => window.jiaMentions?.open(term, event)}
    />
  ) : (
    <button
      className="jia-person-check"
      type="button"
      disabled={!person.available}
      data-label={person.available ? "查证入档" : "待发档册"}
      aria-label={
        person.available
          ? `查证入档：${term}`
          : `${term}：对应档册尚未发下`
      }
      title={
        person.available
          ? "带到档册，自行选档后再检索入档"
          : "对应档册尚未发下，后续可查证"
      }
      onClick={() => onSearch(term)}
    />
  );
  const mentions = !person.registered ? (
    <button
      className="jia-person-check jia-person-mentions"
      data-label="查看提及"
      aria-label={`查看提及：${term}`}
      title="查看已找到案卷里提到这个名字的原文"
      onClick={(event) => window.jiaMentions?.open(term, event)}
    />
  ) : null;
  return (
    <span className="jia-person-term" key={key}>
      {excerpt}
      {action}
      {mentions}
    </span>
  );
}

function JiaPersonCompletePlaque({ checks }) {
  if (!checks.length || checks.some((check) => !check.registered)) return null;
  return (
    <p className="jia-person-plaque" role="status">
      本卷姓名已入档
    </p>
  );
}

function JiaPersonCheckFooter({ checks }) {
  if (!checks.length) return null;
  const pending = checks.filter((check) => !check.registered);
  if (!pending.length) return null;
  const waiting = pending.filter((check) => !check.available).length;
  return (
    <section
      className="jia-person-summary"
      aria-live="polite"
      aria-label="本卷姓名入档进度"
    >
      <p className="jia-person-summary-title">
        {`本卷已出现的人名或称呼，还有 ${pending.length} 人未入档${waiting ? `（${waiting} 人待发档册）` : ""}。`}
      </p>
    </section>
  );
}

function decorate(text, terms, onSearch, docId, checks, usedTerms) {
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
      jiaPersonTerm(hit, docId, onSearch, checks, `${hit}-${parts.length}`),
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
  hint = "单击查档；悬停可摘录。虚线为已摘录。",
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
  const usedTerms = new Set();
  return (
    <article className="panel document" data-jia-doc={doc.id}>
      <button className="text-btn" onClick={onBack} type="button">
        {backLabel}
      </button>
      <p className="kind">{doc.kind}</p>
      <h2>{doc.title}</h2>
      <JiaPersonCompletePlaque checks={personChecks} />
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
            personChecks,
            usedTerms,
          )}
        </p>
      ))}
      <JiaPersonCheckFooter checks={personChecks} />
      {hint ? <p className="hint">{hint}</p> : null}
    </article>
  );
}
