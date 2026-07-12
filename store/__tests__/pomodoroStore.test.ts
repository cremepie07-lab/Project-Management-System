import { usePomodoroStore, WORK_SEC, BREAK_SEC } from "../pomodoroStore";

describe("pomodoroStore", () => {
  beforeEach(() => {
    // Reset the store before each test
    usePomodoroStore.getState().clear();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = usePomodoroStore.getState();
      expect(state.cardId).toBeNull();
      expect(state.cardTitle).toBeNull();
      expect(state.phase).toBe("work");
      expect(state.running).toBe(false);
      expect(state.pausedRemaining).toBe(WORK_SEC);
      expect(state.getRemaining()).toBe(WORK_SEC);
      expect(state.getPct()).toBe(0);
    });
  });

  describe("attachCard", () => {
    it("should attach a card if no card is currently attached", () => {
      usePomodoroStore.getState().attachCard("card-1", "Task 1");
      const state = usePomodoroStore.getState();
      expect(state.cardId).toBe("card-1");
      expect(state.cardTitle).toBe("Task 1");
    });

    it("should not attach a new card if one is already attached", () => {
      usePomodoroStore.getState().attachCard("card-1", "Task 1");
      usePomodoroStore.getState().attachCard("card-2", "Task 2");
      const state = usePomodoroStore.getState();
      expect(state.cardId).toBe("card-1");
      expect(state.cardTitle).toBe("Task 1");
    });

    it("should force attach a new card even if one is already attached", () => {
      usePomodoroStore.getState().attachCard("card-1", "Task 1");
      usePomodoroStore.getState().forceAttachCard("card-2", "Task 2");
      const state = usePomodoroStore.getState();
      expect(state.cardId).toBe("card-2");
      expect(state.cardTitle).toBe("Task 2");
    });
  });

  describe("Timer Actions", () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should start the timer", () => {
      jest.setSystemTime(new Date("2024-01-01T10:00:00Z"));
      
      usePomodoroStore.getState().start();
      const state = usePomodoroStore.getState();
      
      expect(state.running).toBe(true);
      expect(state.phaseStartedAt).not.toBeNull();
    });

    it("should decrease remaining time while running", () => {
      jest.setSystemTime(new Date("2024-01-01T10:00:00Z"));
      usePomodoroStore.getState().start();
      
      // Advance time by 10 seconds
      jest.setSystemTime(new Date("2024-01-01T10:00:10Z"));
      
      expect(usePomodoroStore.getState().getRemaining()).toBe(WORK_SEC - 10);
    });

    it("should pause the timer", () => {
      jest.setSystemTime(new Date("2024-01-01T10:00:00Z"));
      usePomodoroStore.getState().start();
      
      // Advance time by 15 seconds
      jest.setSystemTime(new Date("2024-01-01T10:00:15Z"));
      usePomodoroStore.getState().pause();
      
      const state = usePomodoroStore.getState();
      expect(state.running).toBe(false);
      expect(state.pausedRemaining).toBe(WORK_SEC - 15);
      expect(state.phaseStartedAt).toBeNull();
    });

    it("should calculate correct percentage", () => {
      jest.setSystemTime(new Date("2024-01-01T10:00:00Z"));
      usePomodoroStore.getState().start();
      
      // Advance time by half of work duration
      jest.setSystemTime(new Date(new Date("2024-01-01T10:00:00Z").getTime() + (WORK_SEC / 2) * 1000));
      expect(usePomodoroStore.getState().getPct()).toBe(50);
    });

    it("should reset the timer", () => {
      usePomodoroStore.getState().start();
      usePomodoroStore.getState().reset();
      
      const state = usePomodoroStore.getState();
      expect(state.running).toBe(false);
      expect(state.phase).toBe("work");
      expect(state.pausedRemaining).toBe(WORK_SEC);
    });

    it("should advance phase", () => {
      usePomodoroStore.getState().advancePhase();
      
      let state = usePomodoroStore.getState();
      expect(state.phase).toBe("break");
      expect(state.pausedRemaining).toBe(BREAK_SEC);
      expect(state.running).toBe(false);

      usePomodoroStore.getState().advancePhase();
      
      state = usePomodoroStore.getState();
      expect(state.phase).toBe("work");
      expect(state.pausedRemaining).toBe(WORK_SEC);
    });
  });
});
