import { useState } from "react";

export default function Home({
  started,
  caseClosed = false,
  verdict = null,
  onStart,
  onContinue,
  onRestart,
  onOpenClearance,
}) {
  const [showHowto, setShowHowto] = useState(false);

  return (
    <section className="home">
      <article className="home-book">
        <div className="home-bind" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <p className="home-stamp" aria-hidden="true">
          户部
        </p>
        <p className="eyebrow">户部清查 · 抄家之后</p>
        <div className="home-slip">
          <h1>贾氏两府清查案</h1>
        </div>

        <div className="home-actions">
          <button
            className={started ? undefined : "primary"}
            type="button"
            onClick={started ? onRestart : onStart}
          >
            {started ? "销案重起" : "开卷查案"}
          </button>
          <button
            className={started ? "primary" : undefined}
            type="button"
            disabled={!started}
            onClick={onContinue}
          >
            {caseClosed ? "复阅前案" : "接续前案"}
          </button>
          {verdict && onOpenClearance ? (
            <button type="button" onClick={onOpenClearance}>
              结案笺
            </button>
          ) : null}
          <button type="button" onClick={() => setShowHowto(true)}>
            查案须知
          </button>
        </div>
      </article>

      {showHowto ? (
        <div
          className="clearance-mask"
          role="dialog"
          aria-modal="true"
          aria-labelledby="howto-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowHowto(false);
          }}
        >
          <article className="home-howto-card">
            <p className="confirm-title" id="howto-title">
              查案须知
            </p>
            <div className="home-howto-body">
              <p className="lede">
                抄家之后，残档摊在书桌上。此案要你把贾氏两府的人填回宗谱。
              </p>
              <p className="howto-head">书桌</p>
              <p className="lede">
                先读书桌残页。页上可点的词，点了便去档册检索。
              </p>
              <p className="howto-head">档册</p>
              <p className="lede">
                档册不是开局就齐，随核认陆续发下。先写下要查的词，再选已发的一档检索；同一句话换一档，结果不同。检索对了，姓名才入档，族谱下拉里才会有这个人。
              </p>
              <p className="howto-head">族谱</p>
              <p className="lede">
                每格填姓名与职分。职分是身份对照，对案卷里的事迹来填，开局就有，不必等人名入档；也不是「谁之妻」「谁之女」。填对的格先不锁。新对满三格，才一并核认；核认时发一纸，档册或有新开。填错了不告哪一格。同房同辈，年长居左。
              </p>
              <p className="lede">
                谱齐则结案。要重看结案笺，或要销案重起，回封面。
              </p>
            </div>
            <button className="home-howto-close" type="button" onClick={() => setShowHowto(false)}>
              收起
            </button>
          </article>
        </div>
      ) : null}
    </section>
  );
}
