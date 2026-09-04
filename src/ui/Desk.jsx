export default function Desk({ items, onOpen, locked }) {
  return (
    <section className="panel">
      <h2>公案桌</h2>
      <p className="lede">
        人名须检索入档才会出现。职分是吏目职分表，开局就有，要用案卷里的事迹去对，材料不会照着表念。第一批只核国公、代字、文字三层。
      </p>
      {locked ? (
        <p className="banner ok">宁荣骨架已核。玉字辈尚未开档。</p>
      ) : null}
      <div className="desk-grid">
        {items.map((item) => (
          <button
            key={item.id}
            className="paper-card"
            onClick={() => onOpen(item.id)}
            type="button"
          >
            <span className="kind">{item.kind}</span>
            <strong>{item.title}</strong>
            <span className="card-foot">{item.body[0]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
