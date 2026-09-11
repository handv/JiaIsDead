import evidenceList from "../data/evidence.json";

export const PAPER_TOTAL = evidenceList.length;
export const NAME_TARGET = 34;
export const RANKS = ["小旗", "总旗", "百户", "千户", "指挥佥事"];
export const GUESS_REVISES = 80;

const MESSY_AXES = new Set([
  "revise",
  "ning",
  "rong",
  "lin",
  "shi",
  "xue",
  "kin",
  "person",
  "role",
  "field",
  "porridge",
]);
const KIN_AXES = new Set(["kin", "lin", "shi", "xue"]);

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, Number(n) || 0));
}

export function houseGroup(house) {
  if (house === "ning") return "ning";
  if (house === "lin" || house === "shi" || house === "xue") return "kin";
  return "rong";
}

export function stampHouse(house) {
  if (house === "ning") return "ning";
  if (house === "lin" || house === "shi" || house === "xue") return house;
  return "rong";
}

export function fieldStamp(field) {
  return field === "role" ? "role" : "person";
}

export function searchAllowance(paperCount = 0, nameTarget = NAME_TARGET) {
  return (Number(nameTarget) || 0) + (Number(paperCount) || 0);
}

export function searchScore(searchCount, paperCount = 0, nameTarget = NAME_TARGET) {
  const extra = Math.max(0, (Number(searchCount) || 0) - searchAllowance(paperCount, nameTarget));
  return clamp(100 - extra * 1, 0, 100);
}

export function paperScore(paperCount, paperTotal = PAPER_TOTAL) {
  const total = Math.max(Number(paperTotal) || 0, 1);
  return clamp(((Number(paperCount) || 0) / total) * 100, 0, 100);
}

export function reviseScore(reviseCount) {
  const extra = Math.max(0, (Number(reviseCount) || 0) - 4);
  return clamp(100 - extra * 4, 0, 100);
}

export function rankOf(score, { paperCount = 0, reviseCount = 0 } = {}) {
  const n = Number(score) || 0;
  const papers = Number(paperCount) || 0;
  const revises = Number(reviseCount) || 0;
  if (revises >= GUESS_REVISES) return "小旗";
  if (n >= 84 && papers >= 36 && revises <= 10) return "指挥佥事";
  if (n >= 72) return "千户";
  if (n >= 60) return "百户";
  if (n >= 46) return "总旗";
  return "小旗";
}

function uniqueLead(rows) {
  const top = Math.max(0, ...rows.map((row) => row.count));
  if (top <= 0) return null;
  const leaders = rows.filter((row) => row.count === top);
  if (leaders.length !== 1) return null;
  return leaders[0];
}

function houseTally(reviseByHouse = {}) {
  const ning = Number(reviseByHouse.ning) || 0;
  const rong = Number(reviseByHouse.rong) || 0;
  const lin = Number(reviseByHouse.lin) || 0;
  const shi = Number(reviseByHouse.shi) || 0;
  const xue = Number(reviseByHouse.xue) || 0;
  const kinLegacy = Number(reviseByHouse.kin) || 0;
  const kinSplit = lin + shi + xue;
  return {
    ning,
    rong,
    lin,
    shi,
    xue,
    kinSplit,
    kin: kinSplit > 0 ? kinSplit : kinLegacy,
  };
}

function roastHouseRows(houses) {
  const rows = [
    { key: "ning", count: houses.ning },
    { key: "rong", count: houses.rong },
  ];
  if (houses.kinSplit > 0) {
    rows.push(
      { key: "lin", count: houses.lin },
      { key: "shi", count: houses.shi },
      { key: "xue", count: houses.xue },
    );
  } else if (houses.kin > 0) {
    rows.push({ key: "kin", count: houses.kin });
  }
  return rows;
}

function commentsConflict(a, b) {
  if (a.axis === b.axis && a.axis !== "done" && a.axis !== "mild") return true;
  if (a.axis === "whole" && MESSY_AXES.has(b.axis)) return true;
  if (b.axis === "whole" && MESSY_AXES.has(a.axis)) return true;
  if (KIN_AXES.has(a.axis) && KIN_AXES.has(b.axis)) return true;
  if (a.axis === "field" && (b.axis === "person" || b.axis === "role")) return true;
  if (b.axis === "field" && (a.axis === "person" || a.axis === "role")) return true;
  if (a.axis === "porridge" && (b.axis === "ning" || b.axis === "rong")) return true;
  if (b.axis === "porridge" && (a.axis === "ning" || a.axis === "rong")) return true;
  return false;
}

function papersPraise(rank, reviseCount, searchExtra) {
  if (rank === "指挥佥事") {
    if (searchExtra <= 0) return "残档尽阅，按页索人。";
    return "抄家的纸一张没漏。";
  }
  if (rank === "千户") {
    if (reviseCount <= 10 && searchExtra <= 0) return "对着残册填的，不是凭肚里那点戏文。";
    if (searchExtra >= 8) return "档册齐了。人丁还在磨。";
    if (reviseCount >= 16) return "卷是齐的。格上还有涂乙。";
    return "抄家的纸一张没漏。";
  }
  if (rank === "百户") {
    if (searchExtra >= 8) return "卷是齐的。人名还要再核。";
    if (reviseCount >= 16) return "办案的纸没少。格上却有涂乙。";
    return "残档是翻完了。细处还要磨。";
  }
  if (reviseCount >= 28) return "残档没落下。人却换了几茬。";
  if (searchExtra >= 16) return "纸是读了。档册也翻得猛。";
  return "抄家残册倒是齐。";
}

function collectPraises(stats) {
  const { houses, person, role, paperCount, paperTotal, reviseCount, searchExtra, rank } = stats;
  const kinQuiet = houses.lin <= 1 && houses.shi <= 1 && houses.xue <= 1 && houses.kin <= 1;
  const items = [];
  if (paperCount >= paperTotal) {
    items.push({
      axis: "papers",
      sharpness: 48,
      text: papersPraise(rank, reviseCount, searchExtra),
    });
  }
  if (reviseCount <= 0) {
    items.push({ axis: "revise", sharpness: 85, text: "一气呵成，此谱无涂乙。" });
  } else if (reviseCount <= 8) {
    items.push({ axis: "revise", sharpness: 64, text: "涂乙不多，墨色还干净。" });
  }
  if (searchExtra <= 0) {
    items.push({ axis: "search", sharpness: 58, text: "按名索骥，并不妄翻。" });
  }
  if (stats.score >= 90 && reviseCount <= 3 && paperCount >= 36) {
    items.push({
      axis: "whole",
      sharpness: 90,
      text: "此案清楚，不须冷子兴再说一遍。",
    });
  }
  if (paperCount >= paperTotal && reviseCount <= 3) {
    items.push({ axis: "whole", sharpness: 75, text: "残档与谱对得上，可结。" });
  }
  if (houses.ning <= 0 && stats.reviseCount >= 4) {
    items.push({ axis: "ning", sharpness: 62, text: "宁府一支比焦大清醒。" });
  }
  if (houses.rong <= 0 && stats.reviseCount >= 4) {
    items.push({ axis: "rong", sharpness: 62, text: "荣府人丁不乱，护官符算是背熟了。" });
  }
  if (kinQuiet && stats.reviseCount >= 4) {
    items.push({ axis: "kin", sharpness: 60, text: "姻亲不曾认成贾姓，已属难得。" });
  }
  if (person + role > 0 && person <= 1 && role <= 1 && stats.reviseCount >= 4) {
    items.push({ axis: "field", sharpness: 52, text: "人未换茬，职分也没扔骰子。" });
  }
  if (rank === "指挥佥事") {
    items.push({ axis: "whole", sharpness: 40, text: "拟从优议叙。可随堂。" });
  } else if (rank === "千户") {
    items.push({ axis: "whole", sharpness: 35, text: "两府骨架清楚，细处亦少涂乙。" });
  } else if (rank === "百户") {
    items.push({ axis: "done", sharpness: 22, text: "填是填齐了，已可过堂。" });
  } else if (rank === "总旗") {
    items.push({ axis: "done", sharpness: 22, text: "人还在谱上。已属不易。" });
  }
  items.push({ axis: "done", sharpness: 1, text: "谱是齐的。" });
  return items;
}

function collectRoasts(stats) {
  const { houses, person, role, paperCount, paperTotal, reviseCount, searchExtra, score } = stats;
  const items = [];
  if (paperCount <= Math.min(12, Math.floor(paperTotal * 0.3))) {
    items.push({
      axis: "papers",
      sharpness: 82,
      text: "残档束之高阁，全凭肚里那点戏文。",
    });
  }
  if (searchExtra >= 16) {
    items.push({ axis: "search", sharpness: 72, text: "档册翻成筛子，人名仍对不稳。" });
  }
  if (reviseCount >= 28) {
    items.push({ axis: "revise", sharpness: 64, text: "此谱三涂两改，墨色发花。" });
  } else if (reviseCount >= 16) {
    items.push({ axis: "revise", sharpness: 48, text: "此谱有涂乙，墨还未干。" });
  }
  const houseLead = uniqueLead(roastHouseRows(houses));
  const houseRoasts = {
    ning: "宁府这一支，像是听焦大喝醉了填的。",
    rong: "荣府人丁，对着护官符蒙的。",
    lin: "林姑娘这一门，差点写进贾家户口。",
    shi: "史大姑娘来回换，保龄侯家没认清。",
    xue: "薛家姨妹认成贾姓，黄金铺得不是地方。",
    kin: "林史薛王搅成一锅，姻亲全靠蒙。",
  };
  if (houseLead && houseRoasts[houseLead.key]) {
    items.push({ axis: houseLead.key, sharpness: 76, text: houseRoasts[houseLead.key] });
  }
  if (houses.ning >= 4 && houses.rong >= 4 && Math.abs(houses.ning - houses.rong) <= 1) {
    items.push({
      axis: "porridge",
      sharpness: 68,
      text: "宁荣一锅粥。冷子兴若在，又要演说一番。",
    });
  }
  const fieldLead = uniqueLead([
    { key: "person", count: person },
    { key: "role", count: role },
  ]);
  if (fieldLead?.key === "person") {
    items.push({ axis: "person", sharpness: 60, text: "人换了一茬，官职倒还老实。" });
  }
  if (fieldLead?.key === "role") {
    items.push({ axis: "role", sharpness: 60, text: "人还在，职分像扔骰子。" });
  }
  if (score >= 78 && reviseCount <= 3) {
    items.push({ axis: "mild", sharpness: 40, text: "只是未免太熟。不像头一回抄家。" });
  }
  items.push({ axis: "mild", sharpness: 1, text: "过堂时少吹两句。" });
  return items;
}

const DISTINCT_AXES = new Set([
  "ning",
  "rong",
  "lin",
  "shi",
  "xue",
  "kin",
  "person",
  "role",
  "porridge",
  "search",
]);

function pairSharpness(praise, roast) {
  let n = praise.sharpness + roast.sharpness;
  if (DISTINCT_AXES.has(roast.axis)) n += 20;
  if (DISTINCT_AXES.has(praise.axis)) n += 8;
  return n;
}

export function pickComments(stats) {
  const praises = collectPraises(stats);
  const roasts = collectRoasts(stats);
  let best = null;
  for (const praise of praises) {
    for (const roast of roasts) {
      if (commentsConflict(praise, roast)) continue;
      const sharpness = pairSharpness(praise, roast);
      if (!best || sharpness > best.sharpness) {
        best = { praise: praise.text, roast: roast.text, sharpness };
      }
    }
  }
  return {
    praise: best?.praise ?? "谱是齐的。",
    roast: best?.roast ?? "过堂时少吹两句。",
  };
}

function commentStats({
  searchCount = 0,
  reviseCount = 0,
  paperCount = 0,
  paperTotal = PAPER_TOTAL,
  nameTarget = NAME_TARGET,
  reviseByHouse = {},
  reviseByField = {},
  score,
  rank,
} = {}) {
  const houses = houseTally(reviseByHouse);
  return {
    score,
    rank,
    paperCount: Number(paperCount) || 0,
    paperTotal: Math.max(Number(paperTotal) || 0, 1),
    reviseCount: Number(reviseCount) || 0,
    searchExtra: Math.max(
      0,
      (Number(searchCount) || 0) - searchAllowance(paperCount, nameTarget),
    ),
    houses,
    person: Number(reviseByField.person) || 0,
    role: Number(reviseByField.role) || 0,
  };
}

export function buildVerdict({
  searchCount = 0,
  reviseCount = 0,
  paperCount = 0,
  paperTotal = PAPER_TOTAL,
  nameTarget = NAME_TARGET,
  reviseByHouse = {},
  reviseByField = {},
} = {}) {
  const search = searchScore(searchCount, paperCount, nameTarget);
  const paper = paperScore(paperCount, paperTotal);
  const revise = reviseScore(reviseCount);
  const familiarity = Math.round(clamp(0.45 * paper + 0.4 * revise + 0.15 * search, 0, 100));
  const title = rankOf(familiarity, { paperCount, reviseCount });
  const { praise, roast } = pickComments(
    commentStats({
      searchCount,
      reviseCount,
      paperCount,
      paperTotal,
      nameTarget,
      reviseByHouse,
      reviseByField,
      score: familiarity,
      rank: title,
    }),
  );
  return {
    familiarity,
    title,
    praise,
    roast,
    weakness: roast,
    searchCount: Number(searchCount) || 0,
    paperCount: Number(paperCount) || 0,
    paperTotal,
    reviseCount: Number(reviseCount) || 0,
  };
}

export function reviveVerdict(saved) {
  if (!saved?.verdict) return null;
  return buildVerdict({
    searchCount: saved.verdict.searchCount ?? saved.searchCount ?? 0,
    reviseCount: saved.verdict.reviseCount ?? saved.reviseCount ?? 0,
    paperCount: saved.verdict.paperCount ?? saved.unlockedIds?.length ?? 0,
    paperTotal: saved.verdict.paperTotal,
    reviseByHouse: saved.reviseByHouse ?? {},
    reviseByField: saved.reviseByField ?? {},
  });
}

export function closedLine(verdict) {
  if (!verdict?.title) return "谱齐了。抄家的单子也对上了。";
  return `锦衣卫叙功${verdict.title}。`;
}
