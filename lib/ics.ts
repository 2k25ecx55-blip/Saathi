import { ActionItem, DocumentAnalysis } from "./schema";
import { addDaysToIsoDate } from "./dates";

/**
 * Escapes special characters for iCalendar (RFC 5545) text fields:
 * backslash, semicolon, comma, and newline.
 */
export function escapeIcsText(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Converts YYYY-MM-DD to YYYYMMDD for iCalendar VALUE=DATE.
 */
export function formatIcsDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

/**
 * Generates an iCalendar (.ics) string for a single action item or all actions in an analysis.
 * Features:
 * - CRLF (\r\n) line endings
 * - VALUE=DATE all-day VEVENT
 * - Two VALARMs (3 days before and 1 day before)
 * - Escaped commas, semicolons, backslashes
 * - Unique UIDs
 */
export function generateIcs(
  actions: ActionItem[],
  issuer: string | null = null,
  calendarTitle: string = "Saathi Deadlines"
): string {
  const resolvedActions = actions.filter(
    (a) => a.deadline && a.deadline.resolved_date
  );

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Saathi//Official Letter Explainer//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarTitle)}`,
  ];

  resolvedActions.forEach((action, index) => {
    const deadlineDate = action.deadline.resolved_date!;
    const nextDay = addDaysToIsoDate(deadlineDate, 1);
    const dtStart = formatIcsDate(deadlineDate);
    const dtEnd = formatIcsDate(nextDay);

    const uid = `saathi-${dtStart}-${index}-${timestamp}@saathi.local`;

    let description = action.task;
    if (issuer) {
      description += ` | Authority: ${issuer}`;
    }
    if (action.why_it_matters) {
      description += ` | Why it matters: ${action.why_it_matters}`;
    }
    if (action.deadline.quote) {
      description += ` | Original Quote: "${action.deadline.quote}"`;
    }

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${timestamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcsText(action.task)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    lines.push("STATUS:CONFIRMED");
    lines.push("TRANSP:TRANSPARENT");

    // VALARM 1: 3 days before
    lines.push("BEGIN:VALARM");
    lines.push("TRIGGER:-P3D");
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:${escapeIcsText(`Reminder: 3 days left - ${action.task}`)}`);
    lines.push("END:VALARM");

    // VALARM 2: 1 day before
    lines.push("BEGIN:VALARM");
    lines.push("TRIGGER:-P1D");
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:${escapeIcsText(`Urgent: Deadline tomorrow - ${action.task}`)}`);
    lines.push("END:VALARM");

    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");

  // MUST use CRLF line endings per RFC 5545
  return lines.join("\r\n") + "\r\n";
}

/**
 * Helper to download an .ics file client-side in the browser.
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith(".ics") ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
