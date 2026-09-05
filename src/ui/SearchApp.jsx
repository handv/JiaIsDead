export default function SearchApp({
  sources,
  sourceId,
  onSelectSource,
  query,
  onQuery,
  onSearch,
  result,
  catalog,
  onOpen,
  returnDoc,
  onBackToDoc,
}) {
  const addedNames = catalog?.names ?? [];
  const added = addedNames.length > 0;
  const source = sources.find((item) => item.id === sourceId) ?? null;

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
          onSearch();
        }}
      >
        <div className="search-row">
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={source?.placeholder ?? "宁公 / 贾政 / 史太君"}
            aria-label="检索"
          />
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
            <p className="banner">此案卷已开。姓名须再点人名才能入档。职分请对职分表，不必等入档。</p>
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
