const DIGITS = "零壹贰叁肆伍陆柒捌玖";

function hanNumber(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) return String(raw);
  if (n < 10) return DIGITS[n];
  if (n === 10) return "拾";
  if (n < 20) return `拾${DIGITS[n - 10]}`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return ones === 0 ? `${DIGITS[tens]}拾` : `${DIGITS[tens]}拾${DIGITS[ones]}`;
  }
  return String(raw);
}

export function versionHan(version) {
  return String(version ?? "")
    .split(".")
    .map(hanNumber)
    .join(".");
}
