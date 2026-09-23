import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ChatNotification from "components/Home/ChatNotification";

describe("ChatNotification", () => {
  it("shows the unread number inside the chat icon", () => {
    const { container } = render(<ChatNotification num={4} />);
    expect(container.querySelector("tspan")!.textContent, "the unread number is not shown").toBe("4");
  });
});
