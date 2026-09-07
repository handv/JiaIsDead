import { useEffect, useRef, useState } from "react";
import { normalizeQuery } from "../game/search.js";

export default function SearchApp({
  sources,
  sourceId,
  onSelectSource,
  query,
  onQuery,
  onSearch,
  history = [],
  onPickHistory,
  onForgetHistory,
  result,
  catalog,
  onOpen,
  returnDoc,
  onBackToDoc,
}) {
  const addedNames = catalog?.names ?? [];
  const added = addedNames.length > 0;
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const typed = normalizeQuery(query);
  const shown = history.filter((item) => !typed || normalizeQuery(item).includes(typed));

  useEffect(() => {
    function hide(event) {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  return (
    <section className="panel">
      {returnDoc ? (
        <button className="text-btn" onClick={onBackToDoc} type="button">
          回到案卷 · {returnDoc.title}
        </button>
      ) : null}
      <h2>档册</h2>
      <p className="lede">
        没有总簿。档册随案情发下，不是开局就齐。先写下要查的词，再选已发的一档检索。同一句话换一档，结果不同。
      </p>
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(false);
          onSearch();
        }}
      >
        <div className="search-row">
          <div className="search-suggest" ref={boxRef}>
            <input
              value={query}
              onChange={(event) => {
                onQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              placeholder="宁公 / 荣公"
              aria-label="检索"
              autoComplete="off"
            />
            {open && shown.length ? (
              <ul className="search-history" aria-label="近日所查">
                {shown.map((term) => (
                  <li key={term}>
                    <button
                      className="search-history-term"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setOpen(false);
                        onPickHistory?.(term);
                      }}
                      type="button"
                    >
                      {term}
                    </button>
                    <button
                      className="search-history-forget"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onForgetHistory?.(term)}
                      type="button"
                      aria-label={`忘却 ${term}`}
                    >
                      忘
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <fieldset className="source-options">
          <legend>搜索档册</legend>
          {sources.map((item) => (
            <label key={item.id} className={item.id === sourceId ? "on" : ""}>
              <input
                type="radio"
                name="search-source"
                checked={item.id === sourceId}
                onChange={() => onSelectSource(item.id)}
              />
              <span>{item.title}</span>
            </label>
          ))}
        </fieldset>
        <button type="submit">检索</button>
      </form>

      {result?.status === "nosource" ? (
        <p className="banner">先选一档再检索。</p>
      ) : null}
      {result?.status === "short" ? (
        <p className="banner">字太少。请写出官称或原句。</p>
      ) : null}
      {result?.status === "empty" ? (
        <p className="banner">此档未载。换一档再查。</p>
      ) : null}
      {result?.status === "ok" ? (
        <>
          {added ? (
            <p className="banner ok">
              已入档
              {addedNames.length ? ` · 姓名 ${addedNames.join("、")}` : ""}
            </p>
          ) : (
            <p className="banner">此案卷已开。姓名须再点人名才能入档。职分请对案卷事迹，不必等入档。</p>
          )}
          <ul className="result-list">
            {result.hits.map((hit) => (
              <li key={hit.id}>
                <h3>{hit.title}</h3>
                <p>{hit.snippet}</p>
                {hit.unlocksEvidenceId ? (
                  <button
                    className="text-btn"
                    onClick={() => onOpen(hit.unlocksEvidenceId)}
                    type="button"
                  >
                    打开案卷 {hit.unlocksEvidenceId}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
