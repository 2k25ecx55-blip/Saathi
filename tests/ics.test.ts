import { describe, it, expect } from "vitest";
import { generateIcs, escapeIcsText } from "../lib/ics";
import { ActionItem } from "../lib/schema";

describe("lib/ics.ts", () => {
  describe("escapeIcsText", () => {
    it("escapes commas, semicolons, backslashes, and newlines", () => {
      const raw = "Income Tax, Dept; Section 143(1)\nNotice & fine";
      const escaped = escapeIcsText(raw);
      expect(escaped).toBe("Income Tax\\, Dept\\; Section 143(1)\\nNotice & fine");
    });
  });

  describe("generateIcs", () => {
    const sampleActions: ActionItem[] = [
      {
        task: "Pay pending water tax, Ward 12",
        deadline: {
          type: "absolute",
          date: "2025-07-20",
          relative_days: null,
          relative_to: null,
          quote: "Strictly pay before 20/07/2025",
          resolved_date: "2025-07-20",
        },
        why_it_matters: "Avoid 2% monthly penalty surcharge",
      },
      {
        task: "Submit response letter; cite ref: A-102",
        deadline: {
          type: "relative",
          date: null,
          relative_days: 15,
          relative_to: "notice_date",
          quote: "within 15 days",
          resolved_date: "2025-07-25",
        },
        why_it_matters: "Protect your legal rights",
      },
      {
        task: "Unresolved item without date",
        deadline: {
          type: "none",
          date: null,
          relative_days: null,
          relative_to: null,
          quote: null,
          resolved_date: null,
        },
        why_it_matters: "Informational",
      },
    ];

    it("uses strict CRLF line endings throughout", () => {
      const ics = generateIcs(sampleActions, "Municipal Corporation");
      expect(ics).toContain("\r\n");
      // Check that lines don't have lone \n without \r
      const splitLines = ics.split("\r\n");
      for (const line of splitLines) {
        expect(line).not.toContain("\n");
      }
    });

    it("generates exactly one VEVENT per resolved deadline", () => {
      const ics = generateIcs(sampleActions, "Municipal Corporation");
      const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
      expect(veventCount).toBe(2); // Only 2 of 3 actions have resolved_date!
    });

    it("creates all-day events with VALUE=DATE format and exclusive next-day DTEND", () => {
      const ics = generateIcs(sampleActions, "Municipal Corporation");
      expect(ics).toContain("DTSTART;VALUE=DATE:20250720");
      expect(ics).toContain("DTEND;VALUE=DATE:20250721");
      expect(ics).toContain("DTSTART;VALUE=DATE:20250725");
      expect(ics).toContain("DTEND;VALUE=DATE:20250726");
    });

    it("includes both -P3D and -P1D VALARM notifications", () => {
      const ics = generateIcs(sampleActions, "Municipal Corporation");
      expect(ics).toContain("TRIGGER:-P3D");
      expect(ics).toContain("TRIGGER:-P1D");
      const alarmCount = (ics.match(/BEGIN:VALARM/g) || []).length;
      expect(alarmCount).toBe(4); // 2 events * 2 alarms = 4
    });

    it("properly escapes text in SUMMARY and DESCRIPTION", () => {
      const ics = generateIcs(sampleActions, "Municipal Corporation");
      // Semicolon and comma in "Pay pending water tax, Ward 12"
      expect(ics).toContain("Pay pending water tax\\, Ward 12");
      expect(ics).toContain("Submit response letter\\; cite ref: A-102");
    });

    it("generates unique UIDs for events", () => {
      const ics = generateIcs(sampleActions, "Municipal Corporation");
      const uids = ics.match(/UID:[^\r\n]+/g) || [];
      expect(uids.length).toBe(2);
      expect(uids[0]).not.toBe(uids[1]);
    });
  });
});
