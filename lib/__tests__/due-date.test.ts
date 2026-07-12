import { formatDueDate, getDueDateStatus, toDateInputValue } from "../due-date";

describe("due-date", () => {
  beforeAll(() => {
    // Mock Date.now to a fixed date for reliable tests: 2024-05-15T12:00:00Z
    jest.spyOn(Date, "now").mockImplementation(() => new Date("2024-05-15T12:00:00Z").getTime());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("formatDueDate", () => {
    it("should format Date object to DD/MM/YYYY", () => {
      // Note: toLocaleDateString might vary depending on the environment running Jest.
      // Usually Node environments use standard formatting.
      const date = new Date("2024-05-15T12:00:00Z");
      expect(formatDueDate(date)).toMatch(/15\/05\/2024/); 
    });

    it("should format ISO string to DD/MM/YYYY", () => {
      expect(formatDueDate("2024-05-15T12:00:00Z")).toMatch(/15\/05\/2024/); 
    });
  });

  describe("getDueDateStatus", () => {
    it("should return null if no date provided", () => {
      expect(getDueDateStatus(null)).toBeNull();
      expect(getDueDateStatus(undefined)).toBeNull();
    });

    it("should return overdue if date is in the past", () => {
      expect(getDueDateStatus("2024-05-14T12:00:00Z")).toBe("overdue");
      expect(getDueDateStatus(new Date("2024-05-10T12:00:00Z"))).toBe("overdue");
    });

    it("should return soon if date is within 24 hours", () => {
      expect(getDueDateStatus("2024-05-15T18:00:00Z")).toBe("soon"); // 6 hours from now
      expect(getDueDateStatus("2024-05-16T11:59:00Z")).toBe("soon"); // 23.9 hours from now
    });

    it("should return normal if date is more than 24 hours away", () => {
      expect(getDueDateStatus("2024-05-16T12:01:00Z")).toBe("normal");
      expect(getDueDateStatus("2024-06-15T12:00:00Z")).toBe("normal");
    });
  });

  describe("toDateInputValue", () => {
    it("should return empty string if no date", () => {
      expect(toDateInputValue(null)).toBe("");
      expect(toDateInputValue(undefined)).toBe("");
    });

    it("should format string to YYYY-MM-DD", () => {
      expect(toDateInputValue("2024-05-15T12:00:00Z")).toBe("2024-05-15");
    });

    it("should format Date object to YYYY-MM-DD", () => {
      const date = new Date("2024-12-31T23:59:59Z");
      expect(toDateInputValue(date)).toBe("2024-12-31");
    });
  });
});
