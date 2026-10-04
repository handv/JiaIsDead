export default function EvidenceIndex({
  items,
  activeId = null,
  readIds = [],
  onOpen,
  heading = "案卷",
}) {
  const read = new Set(readIds);
  return (
    <aside className="evidence-index panel">
      <h2>{heading}</h2>
      <ol>
        {items.map((item) => {
          const classes = [
            item.id === activeId ? "on" : "",
            read.has(item.id) ? "read" : "",
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
