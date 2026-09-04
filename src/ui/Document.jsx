function decorate(text, terms, onSearch) {
  const sorted = [...new Set(terms)].sort((a, b) => b.length - a.length);
  const parts = [];
  let rest = text;

  while (rest.length) {
    let hit = null;
    let index = -1;
    for (const term of sorted) {
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
    parts.push(
      <button
        key={`${hit}-${parts.length}`}
        className="term"
        onClick={() => onSearch(hit)}
        type="button"
      >
        {hit}
      </button>,
    );
    rest = rest.slice(index + hit.length);
  }

  return parts;
}

export default function DocumentView({ doc, terms, onBack, onSearch }) {
  return (
    <article className="panel document">
      <button className="text-btn" onClick={onBack} type="button">
        回到书桌
      </button>
      <p className="kind">{doc.kind}</p>
      <h2>{doc.title}</h2>
      {doc.body.map((para) => (
        <p key={para}>{decorate(para, terms, onSearch)}</p>
      ))}
      <p className="hint">朱圈的字可点，会拿到缙绅录里搜。</p>
    </article>
  );
}
