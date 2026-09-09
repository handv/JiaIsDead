export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "再想想",
  onConfirm,
  onCancel,
}) {
  return (
    <div className="clearance-mask" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <article className="confirm-card">
        <p className="confirm-title" id="confirm-title">
          {title}
        </p>
        <p className="lede">{body}</p>
        <div className="confirm-actions">
          <button type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </article>
    </div>
  );
}
