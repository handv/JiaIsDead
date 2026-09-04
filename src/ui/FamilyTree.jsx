const GENERATIONS = [
  ["gong", "国公辈"],
  ["dai", "代字辈"],
  ["wen", "文字辈"],
];

function byId(slots, id) {
  return slots.find((slot) => slot.id === id);
}

export default function FamilyTree({
  batch1,
  batch2,
  placements,
  names,
  roles,
  batch1Locked,
  batch2Locked,
  submitResult,
  onChange,
  onSubmit1,
  onSubmit2,
}) {
  const reveal = batch1Locked;
  const bloodLocked = batch1Locked;
  const inlawLocked = batch2Locked;
  const batch1Result = submitResult?.batch === 1 ? submitResult : null;
  const batch2Result = submitResult?.batch === 2 ? submitResult : null;

  const slotProps = { placements, names, roles, onChange };
  const spouse = (id) => byId(batch2.slots, id);

  return (
    <section className="panel">
      <h2>贾氏宗谱</h2>
      <p className="lede">
        {reveal
          ? "姻亲格出现在对应的人旁边。黛玉挂贾敏下，不是政老爹的女儿；湘云挂史太君下，不是太君之女。职分仍对开局的表，材料不念表上的用词。错一格整批驳回。"
          : "姓名须点关键词检索入档。职分表开局即有，用演说里的事迹去对（袭了官、好道、员外郎、出嫁），材料不会写出表上的用词。九格全对才钤印；错一格整批驳回，不告哪一格。"}
      </p>
      <p className="hint">已入档姓名 {names.length}</p>

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
                {batch1.slots
                  .filter((slot) => slot.generation === gen && slot.house === "ning")
                  .map((slot) => (
                    <Slot
                      key={slot.id}
                      slot={slot}
                      locked={bloodLocked}
                      {...slotProps}
                    />
                  ))}
              </div>
              <div className="house">
                {gen === "gong" ? (
                  <Slot
                    slot={byId(batch1.slots, "rong-gong")}
                    locked={bloodLocked}
                    {...slotProps}
                  />
                ) : null}
                {gen === "dai" ? (
                  <Branch>
                    <Couple>
                      <Slot
                        slot={byId(batch1.slots, "rong-dai")}
                        locked={bloodLocked}
                        {...slotProps}
                      />
                      {reveal ? (
                        <Slot
                          slot={spouse("daishan-wife")}
                          tone="spouse"
                          locked={inlawLocked}
                          {...slotProps}
                        />
                      ) : null}
                    </Couple>
                    {reveal ? (
                      <Offshoot>
                        <Slot
                          slot={spouse("jiamu-niece")}
                          tone="child"
                          locked={inlawLocked}
                          {...slotProps}
                        />
                      </Offshoot>
                    ) : null}
                  </Branch>
                ) : null}
                {gen === "wen" ? (
                  <>
                    <Couple>
                      <Slot
                        slot={byId(batch1.slots, "rong-wen-1")}
                        locked={bloodLocked}
                        {...slotProps}
                      />
                      {reveal ? (
                        <Slot
                          slot={spouse("she-wife")}
                          tone="spouse"
                          locked={inlawLocked}
                          {...slotProps}
                        />
                      ) : null}
                    </Couple>
                    <Branch>
                      <Couple>
                        <Slot
                          slot={byId(batch1.slots, "rong-wen-2")}
                          locked={bloodLocked}
                          {...slotProps}
                        />
                        {reveal ? (
                          <Slot
                            slot={spouse("zheng-wife")}
                            tone="spouse"
                            locked={inlawLocked}
                            {...slotProps}
                          />
                        ) : null}
                      </Couple>
                      {reveal ? (
                        <Offshoot label="王薛">
                          <Slot
                            slot={spouse("wang-brother")}
                            tone="kin"
                            locked={inlawLocked}
                            {...slotProps}
                          />
                          <Slot
                            slot={spouse("xue-sister")}
                            tone="kin"
                            locked={inlawLocked}
                            {...slotProps}
                          />
                        </Offshoot>
                      ) : null}
                    </Branch>
                    <Branch>
                      <Couple>
                        <Slot
                          slot={byId(batch1.slots, "rong-wen-3")}
                          locked={bloodLocked}
                          {...slotProps}
                        />
                        {reveal ? (
                          <Slot
                            slot={spouse("min-husband")}
                            tone="spouse"
                            locked={inlawLocked}
                            {...slotProps}
                          />
                        ) : null}
                      </Couple>
                      {reveal ? (
                        <Offshoot from="couple">
                          <Slot
                            slot={spouse("min-daughter")}
                            tone="child"
                            locked={inlawLocked}
                            {...slotProps}
                          />
                        </Offshoot>
                      ) : null}
                    </Branch>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {names.length === 0 ? (
        <p className="banner">尚未著录姓名。请先读书桌残页，点出人名再检索。</p>
      ) : null}
      {batch1Result?.reason === "incomplete" ? (
        <p className="banner">还有空格。九格都填了再呈报。</p>
      ) : null}
      {batch1Result?.reason === "mismatch" ? (
        <p className="banner">昭穆未合，整批驳回。请对冷子兴节录再核。</p>
      ) : null}
      {batch1Locked ? (
        <p className="banner ok">宁荣骨架已钤印。敷虽早夭，仍在谱上。</p>
      ) : null}
      {batch2Result?.reason === "incomplete" ? (
        <p className="banner">姻亲格还有空。都填了再呈报。</p>
      ) : null}
      {batch2Result?.reason === "mismatch" ? (
        <p className="banner">姻娅未合，整批驳回。请对座次单和托书再核。</p>
      ) : null}
      {batch2Locked ? (
        <p className="banner ok">联姻入口已钤印。黛玉不入荣府宗子。</p>
      ) : null}

      {batch1Locked ? (
        <button
          className="submit"
          disabled={batch2Locked}
          onClick={onSubmit2}
          type="button"
        >
          {batch2Locked ? "联姻已核" : "呈报核验"}
        </button>
      ) : (
        <button className="submit" onClick={onSubmit1} type="button">
          呈报核验
        </button>
      )}
    </section>
  );
}

function Branch({ children }) {
  return <div className="branch">{children}</div>;
}

function Couple({ children }) {
  return <div className="couple">{children}</div>;
}

function Offshoot({ children, label, from = "spouse" }) {
  return (
    <div className={`offshoot from-${from}`}>
      {label ? <p className="offshoot-label">{label}</p> : null}
      <div className="offshoot-row">{children}</div>
    </div>
  );
}

function Slot({ slot, value, names, roles, locked, onChange, tone = "blood", placements }) {
  if (!slot) return null;
  const current = value ?? placements?.[slot.id];
  return (
    <div className={`slot ${tone} ${locked ? "locked" : ""}`}>
      <p className="slot-hint">{slot.hint}</p>
      <label>
        姓名
        <select
          data-slot={slot.id}
          data-field="personId"
          value={current?.personId ?? ""}
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
          value={current?.role ?? ""}
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
