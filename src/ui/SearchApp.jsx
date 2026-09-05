export default function SearchApp({
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

  return (
    <section className="panel">
      {returnDoc ? (
        <button className="text-btn" onClick={onBackToDoc} type="button">
          回到案卷 · {returnDoc.title}
        </button>
      ) : null}
      <h2>缙绅录</h2>
      <p className="lede">
        点案卷里的人名去检索，姓名才会入档。职分表开局就在族谱里，要用「袭了官」「当家」「守节」「入了宫」这类事迹去对，不要指望材料把表上的用词念给你。
      </p>
      <form
        className="search-row"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="宗祠 / 贾演 / 史太君"
          aria-label="检索"
        />
        <button type="submit">检索</button>
      </form>

      {result?.status === "short" ? (
        <p className="banner">字太少。请写出官称或原句。</p>
      ) : null}
      {result?.status === "empty" ? (
        <p className="banner">吏目未载。或此人不入本批。</p>
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
