const GENERATIONS = [
  ["gong", "国公辈"],
  ["dai", "代字辈"],
  ["wen", "文字辈"],
];

export default function FamilyTree({
  slots,
  placements,
  names,
  roles,
  locked,
  submitResult,
  onChange,
  onSubmit,
}) {
  return (
    <section className="panel">
      <h2>贾氏宗谱 · 第一批</h2>
      <p className="lede">
        姓名须点关键词检索入档。职分表开局即有，用演说里的事迹去对（袭了官、好道、员外郎、出嫁），材料不会写出表上的用词。九格全对才钤印；错一格整批驳回，不告哪一格。
      </p>
      <p className="hint">
        已入档姓名 {names.length}
      </p>

      <div className="tree">
        <div className="tree-head">
          <span>宁国府</span>
          <span>荣国府</span>
        </div>
        {GENERATIONS.map(([gen, label]) => (
          <div key={gen} className="gen-row">
            <h3>{label}</h3>
            <div className="houses">
              <div className="house">
                {slots
                  .filter((slot) => slot.generation === gen && slot.house === "ning")
                  .map((slot) => (
                    <Slot
                      key={slot.id}
                      slot={slot}
                      value={placements[slot.id]}
                      names={names}
                      roles={roles}
                      locked={locked}
                      onChange={onChange}
                    />
                  ))}
              </div>
              <div className="house">
                {slots
                  .filter((slot) => slot.generation === gen && slot.house === "rong")
                  .map((slot) => (
                    <Slot
                      key={slot.id}
                      slot={slot}
                      value={placements[slot.id]}
                      names={names}
                      roles={roles}
                      locked={locked}
                      onChange={onChange}
                    />
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {names.length === 0 ? (
        <p className="banner">尚未著录姓名。请先读书桌残页，点出人名再检索。</p>
      ) : null}
      {submitResult?.reason === "incomplete" ? (
        <p className="banner">还有空格。九格都填了再呈报。</p>
      ) : null}
      {submitResult?.reason === "mismatch" ? (
        <p className="banner">昭穆未合，整批驳回。请对冷子兴节录再核。</p>
      ) : null}
      {submitResult?.reason === "lock" || locked ? (
        <p className="banner ok">宁荣骨架已钤印。敷虽早夭，仍在谱上。</p>
      ) : null}

      <button className="submit" disabled={locked} onClick={onSubmit} type="button">
        {locked ? "已核" : "呈报核验"}
      </button>
    </section>
  );
}

function Slot({ slot, value, names, roles, locked, onChange }) {
  return (
    <div className={`slot ${locked ? "locked" : ""}`}>
      <p className="slot-hint">{slot.hint}</p>
      <label>
        姓名
        <select
          data-slot={slot.id}
          data-field="personId"
          value={value?.personId ?? ""}
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
          data-slot={slot.id}
          data-field="role"
          value={value?.role ?? ""}
          disabled={locked}
          onChange={(event) => onChange(slot.id, "role", event.target.value)}
        >
          <option value="">未填</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
