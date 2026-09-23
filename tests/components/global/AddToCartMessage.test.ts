// The two message helpers hand the text to the shared notification store.
import { describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("store/notifications/reducer", () => ({
  showSuccessNotification: spies.success,
  showErrorNotification: spies.error,
}));

import { showErrorMessage, showSuccessMessage } from "components/global/AddToCartMessage";

describe("the short message helpers", () => {
  it("sends a success message to the success notification", () => {
    showSuccessMessage("Added");
    expect(spies.success, "the success text never reached the notification store").toHaveBeenCalledWith("Added");
    expect(spies.error, "a success message must not be shown as an error").not.toHaveBeenCalled();
  });

  it("sends an error message to the error notification", () => {
    showErrorMessage("Failed");
    expect(spies.error, "the error text never reached the notification store").toHaveBeenCalledWith("Failed");
  });
});
