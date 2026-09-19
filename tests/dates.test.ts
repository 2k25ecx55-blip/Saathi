import { describe, it, expect } from "vitest";
import {
  isValidIsoDate,
  addDaysToIsoDate,
  resolveDeadline,
  resolveAllDeadlines,
} from "../lib/dates";
import { DocumentAnalysis, Deadline } from "../lib/schema";

describe("lib/dates.ts", () => {
  describe("isValidIsoDate", () => {
    it("validates correct YYYY-MM-DD dates", () => {
      expect(isValidIsoDate("2025-01-15")).toBe(true);
      expect(isValidIsoDate("2024-02-29")).toBe(true); // leap year
    });

    it("rejects invalid dates and formats", () => {
      expect(isValidIsoDate("2025-02-29")).toBe(false); // non-leap year
      expect(isValidIsoDate("15-01-2025")).toBe(false);
      expect(isValidIsoDate("2025/01/15")).toBe(false);
      expect(isValidIsoDate("invalid")).toBe(false);
      expect(isValidIsoDate(null)).toBe(false);
      expect(isValidIsoDate(undefined)).toBe(false);
    });
  });

  describe("addDaysToIsoDate edge cases", () => {
    it("handles standard day addition", () => {
      expect(addDaysToIsoDate("2025-04-10", 5)).toBe("2025-04-15");
    });

    it("handles month-end rollovers", () => {
      // Jan 31 + 1 day -> Feb 01
      expect(addDaysToIsoDate("2025-01-31", 1)).toBe("2025-02-01");
      // Feb 28 in non-leap year + 1 day -> Mar 01
      expect(addDaysToIsoDate("2025-02-28", 1)).toBe("2025-03-01");
      // Feb 28 in leap year 2024 + 1 day -> Feb 29
      expect(addDaysToIsoDate("2024-02-28", 1)).toBe("2024-02-29");
      // Feb 29 in leap year + 1 day -> Mar 01
      expect(addDaysToIsoDate("2024-02-29", 1)).toBe("2024-03-01");
    });

    it("handles year-end rollovers", () => {
      expect(addDaysToIsoDate("2025-12-30", 3)).toBe("2026-01-02");
    });

    it("handles 30-day month rollovers (e.g. April, June, September, November)", () => {
      expect(addDaysToIsoDate("2025-04-30", 15)).toBe("2025-05-15");
    });
  });

  describe("resolveDeadline", () => {
    it("resolves absolute deadline directly", () => {
      const deadline: Deadline = {
        type: "absolute",
        date: "2025-06-30",
        relative_days: null,
        relative_to: null,
        quote: "Submit before 30th June 2025",
      };

      const result = resolveDeadline(deadline, "2025-06-01");
      expect(result.resolved_date).toBe("2025-06-30");
      expect(result.resolved_error).toBeNull();
    });

    it("resolves relative deadline when notice_date is present", () => {
      const deadline: Deadline = {
        type: "relative",
        date: null,
        relative_days: 15,
        relative_to: "notice_date",
        quote: "within 15 days of this notice",
      };

      const result = resolveDeadline(deadline, "2025-03-10");
      expect(result.resolved_date).toBe("2025-03-25");
      expect(result.resolved_error).toBeNull();
    });

    it("leaves relative deadline unresolved when notice_date is missing", () => {
      const deadline: Deadline = {
        type: "relative",
        date: null,
        relative_days: 30,
        relative_to: "notice_date",
        quote: "within thirty days from the date of receipt",
      };

      const result = resolveDeadline(deadline, null);
      expect(result.resolved_date).toBeNull();
      expect(result.resolved_error).toContain("date can't be calculated: the letter has no issue date");
      // The original quote is preserved!
      expect(result.quote).toBe("within thirty days from the date of receipt");
    });

    it("handles type none cleanly", () => {
      const deadline: Deadline = {
        type: "none",
        date: null,
        relative_days: null,
        relative_to: null,
        quote: null,
      };

      const result = resolveDeadline(deadline, "2025-01-01");
      expect(result.resolved_date).toBeNull();
      expect(result.resolved_error).toBeNull();
    });
  });

  describe("resolveAllDeadlines", () => {
    it("post-processes entire DocumentAnalysis object", () => {
      const rawAnalysis: DocumentAnalysis = {
        doc_type: "bank_letter",
        issuer: "State Bank of India",
        notice_date: "2025-05-20",
        summary: "Notice regarding pending KYC update.",
        urgency: "high",
        actions: [
          {
            task: "Submit PAN Card copy to the home branch",
            deadline: {
              type: "relative",
              date: null,
              relative_days: 10,
              relative_to: "notice_date",
              quote: "Within 10 days of the date of this letter",
            },
            why_it_matters: "Avoid debit freeze on your savings account",
          },
          {
            task: "Verify mobile number via OTP on portal",
            deadline: {
              type: "absolute",
              date: "2025-06-15",
              relative_days: null,
              relative_to: null,
              quote: "Strictly before 15-06-2025",
            },
            why_it_matters: "Mandatory for SMS alerts",
          },
        ],
        documents_needed: ["PAN Card", "Aadhaar Card"],
        if_ignored: "Account operations will be restricted",
        contacts: [{ label: "Helpline", value: "1800-1234" }],
        unclear_points: [],
        readable: true,
        language: "en",
      };

      const resolved = resolveAllDeadlines(rawAnalysis);
      expect(resolved.actions[0].deadline.resolved_date).toBe("2025-05-30");
      expect(resolved.actions[0].deadline.quote).toBe("Within 10 days of the date of this letter");
      expect(resolved.actions[1].deadline.resolved_date).toBe("2025-06-15");
    });
  });
});
