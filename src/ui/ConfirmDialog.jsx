export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "再想想",
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="clearance-mask"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <article className="home-howto-card">
        <p className="confirm-title" id="confirm-title">
          {title}
        </p>
        <p className="lede">{body}</p>
        <div className="home-howto-actions">
          <button className="home-howto-close" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="home-howto-close primary" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </article>
    </div>
  );
}
