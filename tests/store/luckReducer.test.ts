import { describe, expect, it, beforeEach } from "vitest";
import { useAppStore } from "store";

describe("Luck store reducer actions", () => {
  beforeEach(() => {
    useAppStore.setState({
      luckByProduct: {},
    });
  });

  it("startLuck initializes timer for product", () => {
    useAppStore.getState().startLuck(101, 300);

    const timer = useAppStore.getState().luckByProduct["101"];
    expect(timer, "timer should be defined").toBeDefined();
    expect(timer.expired, "timer should not be expired initially").toBe(false);
    expect(typeof timer.deadlineTs, "deadlineTs should be number timestamp").toBe("number");
  });

  it("pauseLuck pauses running countdown", () => {
    useAppStore.getState().startLuck(101, 300);
    useAppStore.getState().pauseLuck(101);

    const timer = useAppStore.getState().luckByProduct["101"];
    expect(timer.deadlineTs, "deadlineTs should be null when paused").toBeNull();
    expect(typeof timer.pausedRemaining, "pausedRemaining should hold remaining seconds").toBe("number");
  });

  it("resumeLuck resumes paused countdown with fresh deadline", () => {
    useAppStore.getState().startLuck(101, 300);
    useAppStore.getState().pauseLuck(101);
    useAppStore.getState().resumeLuck(101);

    const timer = useAppStore.getState().luckByProduct["101"];
    expect(timer.pausedRemaining, "pausedRemaining should be reset to null").toBeNull();
    expect(typeof timer.deadlineTs, "deadlineTs should be updated to timestamp").toBe("number");
  });

  it("expireLuck marks timer expired and records redemption", () => {
    useAppStore.getState().startLuck(101, 300);
    useAppStore.getState().expireLuck(101);

    const timer = useAppStore.getState().luckByProduct["101"];
    expect(timer.expired, "expired should be true").toBe(true);
    expect(timer.pausedRemaining, "pausedRemaining should be 0").toBe(0);
  });
});
