export default function EvidenceIndex({
  items,
  activeId = null,
  readIds = [],
  peopleCompleteIds = [],
  onOpen,
  heading = "案卷",
}) {
  const read = new Set(readIds);
  const peopleDone = new Set(peopleCompleteIds);
  return (
    <aside className="evidence-index panel">
      <div className="jia-index-head">
        <h2>{heading}</h2>
        <p className="jia-index-legend">墨／灰／红／绿：未读·已读·在读·已入档</p>
      </div>
      <ol>
        {items.map((item) => {
          const done = peopleDone.has(item.id);
          const classes = [
            item.id === activeId ? "on" : "",
            read.has(item.id) ? "read" : "",
            done ? "people-done" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <li key={item.id}>
              <button
                className={classes || undefined}
                onClick={() => onOpen(item.id)}
                type="button"
              >
                {item.title}
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
