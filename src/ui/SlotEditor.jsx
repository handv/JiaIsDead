export default function SlotEditor({
  slot,
  value,
  names,
  roles,
  roleGloss = {},
  locked,
  onChange,
  onClose,
}) {
  if (!slot) return null;
  const current = value ?? {};
  return (
    <div
      className="slot-editor-mask"
      role="dialog"
      aria-modal="true"
      aria-label="著录"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article className="slot-editor">
        <p className="slot-editor-kicker">
          {slot.hint}
          {locked ? " · 已核" : ""}
        </p>
        <label>
          姓名
          <select
            value={current.personId ?? ""}
            disabled={locked}
            onChange={(event) => onChange(slot.id, "personId", event.target.value)}
          >
            <option value="">未填</option>
            {names.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          职分
          <select
            value={current.role ?? ""}
            disabled={locked}
            onChange={(event) => onChange(slot.id, "role", event.target.value)}
          >
            <option value="">未填</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleGloss[role] ? `${role} · ${roleGloss[role]}` : role}
              </option>
            ))}
          </select>
        </label>
        <div className="confirm-actions">
          <button type="button" onClick={onClose}>
            {locked ? "收起" : "著录"}
          </button>
        </div>
      </article>
    </div>
  );
}
