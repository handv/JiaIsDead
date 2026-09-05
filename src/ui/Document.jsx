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

const LETTER_KINDS = new Set(["书信", "家书", "手札", "遗言"]);
const DATED_KINDS = new Set(["书信", "家书", "手札", "遗言", "日记"]);

function paraClass(kind, index, total) {
  if (!DATED_KINDS.has(kind) || total < 2) return undefined;
  if (index === total - 1) return "letter-date";
  if (index === total - 2) return "letter-from";
  if (LETTER_KINDS.has(kind) && index === 0) return "letter-open";
  return "letter-body";
}

export default function DocumentView({ doc, terms, onBack, onSearch }) {
  const total = doc.body.length;
  return (
    <article className="panel document">
      <button className="text-btn" onClick={onBack} type="button">
        回到书桌
      </button>
      <p className="kind">{doc.kind}</p>
      <h2>{doc.title}</h2>
      {doc.body.map((para, index) => (
        <p key={para} className={paraClass(doc.kind, index, total)}>
          {decorate(para, terms, onSearch)}
        </p>
      ))}
      <p className="hint">朱圈的字可点。带到档册里，选一档再搜。</p>
    </article>
  );
}
