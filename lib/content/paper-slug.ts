/**
 * Paper URL slugs are `${month}-${year}` with a full English month name
 * (e.g. june-2025). PDF filenames and some typed URLs use abbreviations
 * (jun-2025); resolve both to the same paper.
 */

const MONTH_ALIASES: Record<string, string> = {
  january: "january",
  jan: "january",
  february: "february",
  feb: "february",
  march: "march",
  mar: "march",
  april: "april",
  apr: "april",
  may: "may",
  june: "june",
  jun: "june",
  july: "july",
  jul: "july",
  august: "august",
  aug: "august",
  september: "september",
  sep: "september",
  sept: "september",
  october: "october",
  oct: "october",
  november: "november",
  nov: "november",
  december: "december",
  dec: "december",
};

export function normalizeMonthToken(month: string): string {
  const key = month
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return MONTH_ALIASES[key] ?? key;
}

export function toPaperSlug(month: string, year: number | string): string {
  return `${normalizeMonthToken(month)}-${year}`;
}

export function paperMatchesSlug(
  paper: { month: string; year: number | string },
  slug: string
): boolean {
  return toPaperSlug(paper.month, paper.year) === toPaperSlugFromParam(slug);
}

export function toPaperSlugFromParam(slug: string): string {
  const trimmed = slug.trim().toLowerCase();
  const match = trimmed.match(/^([a-z]+)-(\d{4})$/);
  if (!match) return trimmed;
  return `${normalizeMonthToken(match[1])}-${match[2]}`;
}
