import evidenceList from "../data/evidence.json";

export const PAPER_TOTAL = evidenceList.length;
export const NAME_TARGET = 34;

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, Number(n) || 0));
}

export function houseGroup(house) {
  if (house === "ning") return "ning";
  if (house === "lin" || house === "shi" || house === "xue") return "kin";
  return "rong";
}

export function searchScore(searchCount, nameTarget = NAME_TARGET) {
  const used = Math.max(Number(searchCount) || 0, nameTarget);
  return clamp(100 - (used - nameTarget) * 2, 0, 100);
}

export function paperScore(paperCount, paperTotal = PAPER_TOTAL) {
  const total = Math.max(Number(paperTotal) || 0, 1);
  return clamp(((Number(paperCount) || 0) / total) * 100, 0, 100);
}

export function reviseScore(reviseCount) {
  return clamp(100 - (Number(reviseCount) || 0) * 4, 0, 100);
}

export function familiarityTitle(score) {
  const n = Number(score) || 0;
  if (n >= 90) return "冷子兴同席";
  if (n >= 75) return "谱系清楚";
  if (n >= 60) return "看过戏文";
  return "护官符刚背完";
}

export function weaknessLine(reviseByHouse = {}) {
  const rows = [
    { key: "ning", count: Number(reviseByHouse.ning) || 0, text: "宁府靠蒙" },
    { key: "rong", count: Number(reviseByHouse.rong) || 0, text: "荣府靠蒙" },
    { key: "kin", count: Number(reviseByHouse.kin) || 0, text: "外亲靠蒙" },
  ];
  const top = Math.max(...rows.map((row) => row.count));
  if (top <= 0) return "";
  const leaders = rows.filter((row) => row.count === top);
  if (leaders.length !== 1) return "";
  const second = Math.max(...rows.filter((row) => row.key !== leaders[0].key).map((row) => row.count));
  if (top - second <= 1) return "";
  return leaders[0].text;
}

export function buildVerdict({
  searchCount = 0,
  reviseCount = 0,
  paperCount = 0,
  paperTotal = PAPER_TOTAL,
  nameTarget = NAME_TARGET,
  reviseByHouse = {},
} = {}) {
  const search = searchScore(searchCount, nameTarget);
  const paper = paperScore(paperCount, paperTotal);
  const revise = reviseScore(reviseCount);
  const raw = 0.4 * search + 0.35 * paper + 0.25 * revise;
  const familiarity = Math.round(clamp(raw, 55, 96));
  return {
    familiarity,
    title: familiarityTitle(familiarity),
    weakness: weaknessLine(reviseByHouse),
    searchCount: Number(searchCount) || 0,
    paperCount: Number(paperCount) || 0,
    paperTotal,
    reviseCount: Number(reviseCount) || 0,
  };
}

export function closedLine(verdict) {
  if (!verdict?.familiarity) return "谱齐了。抄家的单子也对上了。";
  return `你对红楼梦的熟悉度 ${verdict.familiarity}%。`;
}
