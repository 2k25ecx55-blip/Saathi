import { DocumentAnalysis, ActionItem, Deadline } from "./schema";

/**
 * Validates whether a string is a strict YYYY-MM-DD date.
 */
export function isValidIsoDate(dateStr: string | null | undefined): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const [year, month, day] = dateStr.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Adds an integer number of days to a YYYY-MM-DD ISO date string in UTC.
 * Correctly handles leap years, month-end rollovers (e.g. Jan 31 + 1 day -> Feb 1),
 * year-end rollovers, and negative offsets.
 */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  if (!isValidIsoDate(isoDate)) {
    throw new Error(`Invalid ISO date provided: "${isoDate}"`);
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Add days using UTC to prevent any daylight saving time or local timezone distortion
  date.setUTCDate(date.getUTCDate() + days);

  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

/**
 * Deterministically resolves deadlines in an ActionItem.
 * - absolute: uses specified ISO date
 * - relative: if notice_date exists, calculates notice_date + relative_days.
 *             If notice_date is missing, leaves unresolved and attaches error.
 * - none: no deadline
 */
export function resolveDeadline(
  deadline: Deadline,
  noticeDate: string | null | undefined
): Deadline {
  const updated: Deadline = { ...deadline };

  if (updated.type === "absolute") {
    if (updated.date && isValidIsoDate(updated.date)) {
      updated.resolved_date = updated.date;
      updated.resolved_error = null;
    } else {
      updated.resolved_date = null;
      updated.resolved_error = "Invalid or missing absolute deadline date";
    }
    return updated;
  }

  if (updated.type === "relative") {
    if (noticeDate && isValidIsoDate(noticeDate) && typeof updated.relative_days === "number") {
      try {
        updated.resolved_date = addDaysToIsoDate(noticeDate, updated.relative_days);
        updated.resolved_error = null;
      } catch (err) {
        updated.resolved_date = null;
        updated.resolved_error = (err as Error).message;
      }
    } else {
      updated.resolved_date = null;
      updated.resolved_error = "date can't be calculated: the letter has no issue date";
    }
    return updated;
  }

  // type === "none"
  updated.resolved_date = null;
  updated.resolved_error = null;
  return updated;
}

/**
 * Deterministically post-processes the complete DocumentAnalysis.
 * The LLM reads and extracts; code strictly handles deterministic resolution.
 */
export function resolveAllDeadlines(analysis: DocumentAnalysis): DocumentAnalysis {
  const processedActions: ActionItem[] = (analysis.actions || []).map((action) => ({
    ...action,
    deadline: resolveDeadline(action.deadline, analysis.notice_date),
  }));

  return {
    ...analysis,
    actions: processedActions,
  };
}

/**
 * Formats YYYY-MM-DD for friendly user presentation.
 */
export function formatDisplayDate(
  isoDate: string | null | undefined,
  locale: string = "en-IN"
): string {
  if (!isoDate || !isValidIsoDate(isoDate)) return "";
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
