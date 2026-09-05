export default function EvidenceIndex({
  items,
  activeId = null,
  freshId = null,
  onOpen,
}) {
  return (
    <aside className="evidence-index panel">
      <h2>案卷</h2>
      <ol>
        {items.map((item) => {
          const classes = [
            item.id === activeId ? "on" : "",
            item.id === freshId ? "fresh" : "",
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
