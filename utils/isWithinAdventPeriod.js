/**
 * Returns true only if today's date is between
 * December 1st and December 24th (inclusive).
 */
export function isWithinAdventPeriod(date = new Date()) {
  const month = date.getMonth() + 1; // JS months are 0–11
  const day = date.getDate();

  return month === 12 && day >= 1 && day <= 24;
}
