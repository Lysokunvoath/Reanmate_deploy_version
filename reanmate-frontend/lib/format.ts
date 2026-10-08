const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export function toKhmerNumber(value: number): string {
  return String(value)
    .split("")
    .map((ch) => (/\d/.test(ch) ? KHMER_DIGITS[Number(ch)] : ch))
    .join("");
}
