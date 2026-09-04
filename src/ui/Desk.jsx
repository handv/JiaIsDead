export default function Desk({
  items,
  onOpen,
  batch1Locked,
  batch2Locked,
  batch3Locked,
}) {
  const lede = batch3Locked
    ? "嫡脉玉字已核。庶出尚未开档。"
    : batch2Locked
      ? "人名须检索入档才会出现。职分是吏目职分表，开局就有。联姻已钤，宫花档已发下。本批只核嫡脉玉字，不填庶出。"
      : batch1Locked
        ? "人名须检索入档才会出现。职分是吏目职分表，开局就有。骨架已钤，寿礼正席已发下。联姻只核内眷、林家、史家、王薛，不填玉字宗子。"
        : "人名须检索入档才会出现。职分是吏目职分表，开局就有，要用案卷里的事迹去对，材料不会照着表念。第一批只核国公、代字、文字三层。";

  return (
    <section className="panel">
      <h2>公案桌</h2>
      <p className="lede">{lede}</p>
      {batch1Locked && !batch2Locked ? (
        <p className="banner ok">宁荣骨架已核。联姻档已开，请看寿礼正席，纸角另有散页。</p>
      ) : null}
      {batch2Locked && !batch3Locked ? (
        <p className="banner ok">联姻入口已核。宫花档已开，请对回条、丧榜再核。</p>
      ) : null}
      {batch3Locked ? (
        <p className="banner ok">嫡脉玉字已核。庶出尚未开档。</p>
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
