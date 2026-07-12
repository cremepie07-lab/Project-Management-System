import { formatDuration, formatClock, sumTrackedSeconds } from "../time-format";

describe("time-format", () => {
  describe("formatDuration", () => {
    it("should format seconds to seconds", () => {
      expect(formatDuration(45)).toBe("45s");
      expect(formatDuration(0)).toBe("0s");
    });

    it("should format seconds to minutes and seconds", () => {
      expect(formatDuration(90)).toBe("1m 30s");
      expect(formatDuration(3599)).toBe("59m 59s");
      expect(formatDuration(60)).toBe("1m 0s");
    });

    it("should format seconds to hours and minutes", () => {
      expect(formatDuration(3600)).toBe("1h 0m");
      expect(formatDuration(5400)).toBe("1h 30m");
      expect(formatDuration(3660)).toBe("1h 1m");
    });

    it("should ignore decimals and negative values", () => {
      expect(formatDuration(45.6)).toBe("45s");
      expect(formatDuration(-10)).toBe("0s");
    });
  });

  describe("formatClock", () => {
    it("should format seconds to mm:ss", () => {
      expect(formatClock(0)).toBe("00:00");
      expect(formatClock(45)).toBe("00:45");
      expect(formatClock(60)).toBe("01:00");
      expect(formatClock(90)).toBe("01:30");
      expect(formatClock(3599)).toBe("59:59");
    });
    
    it("should format hours to just more minutes", () => {
      expect(formatClock(3600)).toBe("60:00");
      expect(formatClock(3665)).toBe("61:05");
    });
  });

  describe("sumTrackedSeconds", () => {
    it("should return 0 for empty array", () => {
      expect(sumTrackedSeconds([])).toBe(0);
    });

    it("should sum completed entries", () => {
      const entries = [
        { startedAt: new Date("2024-01-01T10:00:00Z"), endedAt: new Date("2024-01-01T10:01:00Z") }, // 60s
        { startedAt: new Date("2024-01-01T11:00:00Z"), endedAt: new Date("2024-01-01T11:00:30Z") }, // 30s
      ];
      expect(sumTrackedSeconds(entries)).toBe(90);
    });

    it("should calculate active entry up to now", () => {
      const now = Date.now();
      const tenSecondsAgo = new Date(now - 10000);
      
      const entries = [
        { startedAt: tenSecondsAgo, endedAt: null }, // 10s
      ];
      
      // Since it relies on Date.now() internally, we might have a slight difference.
      // We will allow a small margin of error (e.g., 0-1s) or just mock Date.now
      jest.spyOn(Date, "now").mockImplementation(() => now);
      expect(sumTrackedSeconds(entries)).toBe(10);
      jest.restoreAllMocks();
    });
  });
});
