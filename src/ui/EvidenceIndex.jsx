export default function EvidenceIndex({
  items,
  totalCount = 0,
  activeId = null,
  readIds = [],
  peopleCompleteIds = [],
  onOpen,
  heading = "案卷",
}) {
  const read = new Set(readIds);
  const peopleDone = new Set(peopleCompleteIds);
  const found = items.length;
  const total = totalCount > 0 ? totalCount : found;
  return (
    <aside className="evidence-index panel">
      <div className="jia-index-head">
        <div className="jia-index-title-row">
          <h2>{heading}</h2>
          <p className="jia-index-count" aria-label={`已出现 ${found} 卷，共 ${total} 卷`}>
            {found}/{total}
          </p>
        </div>
        <p className="jia-index-legend">墨／灰／红／绿：未读·已读·在读·已入档</p>
      </div>
      <ol>
        {items.map((item) => {
          const isRead = read.has(item.id);
          const done = isRead && peopleDone.has(item.id);
          const classes = [
            item.id === activeId ? "on" : "",
            isRead ? "read" : "",
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
