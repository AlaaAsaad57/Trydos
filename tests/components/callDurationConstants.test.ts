// The call time limits shared by the chat call screens.
import { describe, expect, it } from "vitest";

import {
  CALL_END_DURATION_MINUTES,
  CALL_WARNING_MESSAGE_MINUTES,
} from "components/callDurationConstants";

describe("the call duration limits", () => {
  it("warns at 5 minutes and ends the call at 10", () => {
    expect(CALL_END_DURATION_MINUTES, "a call must end after 10 minutes").toBe(10);
    expect(CALL_WARNING_MESSAGE_MINUTES, "the warning must come at 5 minutes").toBe(5);
  });
});
