// Cuban Carné de Identidad (No. CI) helpers.
// The CI is 11 digits; the first 6 encode the date of birth as YYMMDD:
//   digits 1-2 = last two digits of the birth year
//   digits 3-4 = month
//   digits 5-6 = day
// Example: 01052360900 -> 01/05/23 -> born 2001-05-23.

/** True if the string is exactly 11 digits. */
export function isValidCiFormat(ci: string): boolean {
  return /^\d{11}$/.test(ci);
}

/** Build the expected YYMMDD prefix from a date of birth (uses UTC parts). */
export function ciPrefixFromDob(dob: Date): string {
  const yy = String(dob.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(dob.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dob.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

/** Parse an <input type="date"> value (YYYY-MM-DD) into a UTC-midnight Date, or null. */
export function parseDobInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  if (year < 1940 || date.getTime() > Date.now()) return null;
  return date;
}

/** Does the CI's first 6 digits match the given date of birth? */
export function ciMatchesDob(ci: string, dob: Date): boolean {
  return isValidCiFormat(ci) && ci.slice(0, 6) === ciPrefixFromDob(dob);
}
