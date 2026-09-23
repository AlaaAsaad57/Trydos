// The cropped photo preview before it is sent
// (components/Chat/components/ChatImagePreviewBeforeSend.tsx).
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

import ChatImagePreviewBeforeSend from "components/Chat/components/ChatImagePreviewBeforeSend";

describe("ChatImagePreviewBeforeSend", () => {
  it("shows the photo, sends it, and cancels from either button", async () => {
    const cancel = vi.fn();
    const send = vi.fn();
    await renderWithProviders(
      <ChatImagePreviewBeforeSend
        croppedImagePreview="data:image/png;base64,aGk="
        handleImagePreviewCancel={cancel}
        handleImagePreviewSend={send}
      />,
    );
    expect(screen.getByAltText("Cropped preview"), "the cropped photo was not shown").toBeInTheDocument();
    fireEvent.click(screen.getByText("Send"));
    expect(send, "the photo was not sent").toHaveBeenCalled();
    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByLabelText("Close"));
    expect(cancel, "cancel and close did not both cancel").toHaveBeenCalledTimes(2);
  });
});
