import {
  getWeekStart,
  getWeekEnd,
  getDayLabel,
  getDaysOfWeek,
  toISODate,
  formatDateShort,
  isSameWeek,
} from "../date-utils";

describe("date-utils", () => {
  describe("getWeekStart", () => {
    it("returns same date when today is Monday", () => {
      // 2026-07-13 is a Monday
      const mon = new Date(2026, 6, 13); // July 13, 2026
      const ws = getWeekStart(mon);
      expect(ws.getFullYear()).toBe(2026);
      expect(ws.getMonth()).toBe(6);
      expect(ws.getDate()).toBe(13);
      expect(ws.getHours()).toBe(0);
      expect(ws.getMinutes()).toBe(0);
    });

    it("returns previous Monday when today is Sunday", () => {
      // 2026-07-12 is a Sunday
      const sun = new Date(2026, 6, 12);
      const ws = getWeekStart(sun);
      expect(ws.getDate()).toBe(6); // Monday July 6
      expect(ws.getMonth()).toBe(6);
    });

    it("returns previous Monday when today is Wednesday", () => {
      // 2026-07-15 is a Wednesday
      const wed = new Date(2026, 6, 15);
      const ws = getWeekStart(wed);
      expect(ws.getDate()).toBe(13); // Monday July 13
      expect(ws.getMonth()).toBe(6);
    });

    it("returns previous Monday when today is Saturday", () => {
      // 2026-07-18 is a Saturday
      const sat = new Date(2026, 6, 18);
      const ws = getWeekStart(sat);
      expect(ws.getDate()).toBe(13); // Monday July 13
    });
  });

  describe("getWeekEnd", () => {
    it("returns Sunday of the current week", () => {
      const mon = new Date(2026, 6, 13);
      const we = getWeekEnd(mon);
      expect(we.getDate()).toBe(19);
      expect(we.getMonth()).toBe(6);
      expect(we.getHours()).toBe(23);
      expect(we.getMinutes()).toBe(59);
    });
  });

  describe("getDayLabel", () => {
    it("returns T2 for Monday", () => {
      expect(getDayLabel(new Date(2026, 6, 13))).toBe("T2");
    });

    it("returns T3 for Tuesday", () => {
      expect(getDayLabel(new Date(2026, 6, 14))).toBe("T3");
    });

    it("returns CN for Sunday", () => {
      expect(getDayLabel(new Date(2026, 6, 12))).toBe("CN");
    });

    it("returns T7 for Saturday", () => {
      expect(getDayLabel(new Date(2026, 6, 18))).toBe("T7");
    });

    it("works with ISO string input", () => {
      expect(getDayLabel("2026-07-13")).toBe("T2");
    });
  });

  describe("getDaysOfWeek", () => {
    it("returns 7 days starting from Monday", () => {
      const days = getDaysOfWeek(new Date(2026, 6, 15)); // Wednesday
      expect(days).toHaveLength(7);
      expect(days[0].label).toBe("T2");
      expect(days[0].date).toBe("2026-07-13");
      expect(days[6].label).toBe("CN");
      expect(days[6].date).toBe("2026-07-19");
    });

    it("all 7 labels are T2..CN in order", () => {
      const days = getDaysOfWeek(new Date(2026, 6, 13)); // Monday
      const labels = days.map((d) => d.label);
      expect(labels).toEqual(["T2", "T3", "T4", "T5", "T6", "T7", "CN"]);
    });
  });

  describe("toISODate", () => {
    it("formats date without timezone shift", () => {
      const d = new Date(2026, 0, 5); // Jan 5 2026 local
      expect(toISODate(d)).toBe("2026-01-05");
    });

    it("pads single-digit month and day", () => {
      const d = new Date(2026, 2, 9); // Mar 9 2026
      expect(toISODate(d)).toBe("2026-03-09");
    });
  });

  describe("formatDateShort", () => {
    it("returns DD/MM", () => {
      expect(formatDateShort(new Date(2026, 6, 13))).toBe("13/7");
    });

    it("works with string input", () => {
      expect(formatDateShort("2026-01-05")).toMatch(/5\/1|05\/01/);
    });
  });

  describe("isSameWeek", () => {
    it("returns true for dates in same Mon-Sun week", () => {
      const mon = new Date(2026, 6, 13);
      const sun = new Date(2026, 6, 19);
      expect(isSameWeek(mon, sun)).toBe(true);
    });

    it("returns false for dates in different weeks", () => {
      const sun = new Date(2026, 6, 12); // Sunday Jul 12 (week of Jul 6-12)
      const mon = new Date(2026, 6, 13); // Monday Jul 13 (week of Jul 13-19)
      expect(isSameWeek(sun, mon)).toBe(false);
    });
  });

  describe("July 13, 2026 is Monday", () => {
    it("getDay() returns 1 (Monday) for 2026-07-13", () => {
      const d = new Date(2026, 6, 13);
      expect(d.getDay()).toBe(1);
    });

    it("getWeekStart(2026-07-13) returns 2026-07-13", () => {
      const ws = getWeekStart(new Date(2026, 6, 13));
      expect(toISODate(ws)).toBe("2026-07-13");
    });
  });
});
