import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const reportStory = vi.fn();
vi.mock("services/story", () => ({
  default: { reportStory: (...a: any[]) => reportStory(...a) },
}));
const showSuccessNotification = vi.fn();
const showErrorNotification = vi.fn();
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showSuccessNotification: (...a: any[]) => showSuccessNotification(...a),
  showErrorNotification: (...a: any[]) => showErrorNotification(...a),
}));

import ReportStoryModal from "components/Home/Stories/ReportStoryModal";

const pick = (value: string) => document.querySelector(`[data-pw="report-reason-${value}"]`) as HTMLButtonElement;
const details = () => document.querySelector('[data-pw="report-details-input"]') as HTMLTextAreaElement;
const submit = () => document.querySelector('[data-pw="report-submit-button"]') as HTMLButtonElement;

describe("ReportStoryModal", () => {
  beforeEach(() => {
    reportStory.mockReset();
    showSuccessNotification.mockReset();
    showErrorNotification.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps Submit off until a reason is picked, and a second tap un-picks it", async () => {
    await renderWithProviders(<ReportStoryModal storyId={1} onClose={() => {}} />);
    expect(submit().disabled, "Submit was on with nothing picked").toBe(true);
    fireEvent.click(pick("spam"));
    expect(pick("spam").getAttribute("aria-pressed"), "the picked reason is not marked").toBe("true");
    expect(submit().disabled, "Submit stayed off after a reason was picked").toBe(false);
    fireEvent.click(pick("spam"));
    expect(submit().disabled, "un-picking the only reason left Submit on").toBe(true);
  });

  it("focuses the details box when Other is picked", async () => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    await renderWithProviders(<ReportStoryModal storyId={1} onClose={() => {}} />);
    fireEvent.click(pick("other"));
    await waitFor(() => expect(document.activeElement, "Other did not move focus to the details box").toBe(details()));
    expect(screen.getByText("Details"), "the details label did not become required").toBeInTheDocument();
  });

  it("treats typed details as Other, and clearing them takes Other away again", async () => {
    await renderWithProviders(<ReportStoryModal storyId={1} onClose={() => {}} />);
    fireEvent.click(pick("spam"));
    fireEvent.change(details(), { target: { value: "  bad  " } });
    expect(pick("other").getAttribute("aria-pressed"), "typing details did not pick Other").toBe("true");
    fireEvent.change(details(), { target: { value: "  bad story " } });
    expect(pick("other").getAttribute("aria-pressed"), "more typing un-picked Other").toBe("true");
    fireEvent.change(details(), { target: { value: "" } });
    expect(pick("other").getAttribute("aria-pressed"), "clearing details kept Other").toBe("false");
    expect(pick("spam").getAttribute("aria-pressed"), "clearing details took away another reason").toBe("true");
    fireEvent.change(details(), { target: { value: "   " } });
    expect(pick("other").getAttribute("aria-pressed"), "blank details picked Other").toBe("false");
    fireEvent.change(details(), { target: { value: "x".repeat(600) } });
    expect(details().value.length, "details were not cut at 500 characters").toBe(500);
    expect(screen.getByText("500/500"), "the counter is wrong").toBeInTheDocument();
  });

  it("sends the stable reason values and trimmed details to the stories backend, then closes", async () => {
    let finish: () => void = () => {};
    reportStory.mockReturnValue(new Promise<void>((r) => (finish = r)));
    const onClose = vi.fn();
    await renderWithProviders(<ReportStoryModal storyId={42} onClose={onClose} />, {
      store: { userProfile: { id: 7 } },
    });
    fireEvent.click(pick("violence"));
    fireEvent.change(details(), { target: { value: " why " } });
    fireEvent.click(submit());
    expect(submit().disabled, "Submit stayed on while sending").toBe(true);
    expect(reportStory, "the report sent the wrong reasons or details").toHaveBeenCalledWith(42, 7, ["violence", "other"], "why");
    await act(async () => finish());
    expect(showSuccessNotification, "the shopper was not told the report went through").toHaveBeenCalledWith("Story reported successfully.");
    expect(onClose, "the sheet did not close after a good report").toHaveBeenCalled();
  });

  it("keeps the sheet open and shows the stories backend's own error", async () => {
    reportStory.mockRejectedValue(new Error("already reported"));
    const onClose = vi.fn();
    await renderWithProviders(<ReportStoryModal storyId={1} onClose={onClose} />);
    fireEvent.click(pick("spam"));
    await act(async () => fireEvent.click(submit()));
    expect(showErrorNotification, "the backend's error was not shown").toHaveBeenCalledWith("already reported");
    expect(onClose, "the sheet closed after a refused report").not.toHaveBeenCalled();
    expect(pick("spam").getAttribute("aria-pressed"), "the picks were lost after a refused report").toBe("true");
  });

  it("falls back to a general message when the error has no text", async () => {
    reportStory.mockRejectedValue({});
    await renderWithProviders(<ReportStoryModal storyId={1} onClose={() => {}} />);
    fireEvent.click(pick("spam"));
    await act(async () => fireEvent.click(submit()));
    expect(showErrorNotification, "no fallback message for an empty error").toHaveBeenCalledWith("Failed to report story.");
  });

  it("closes from the backdrop, the X and Cancel, but not from a tap inside the sheet", async () => {
    const onClose = vi.fn();
    await renderWithProviders(<ReportStoryModal storyId={1} onClose={onClose} />, { language: "ar" });
    const dialog = screen.getByRole("dialog");
    expect(dialog.style.direction, "an Arabic sheet must be right to left").toBe("rtl");
    fireEvent.click(dialog);
    expect(onClose, "a tap inside the sheet closed it").not.toHaveBeenCalled();
    fireEvent.click(dialog.parentElement!);
    fireEvent.click(dialog.querySelector("button")!);
    fireEvent.click(document.querySelector('[data-pw="report-cancel-button"]')!);
    expect(onClose, "backdrop, X and Cancel should each close the sheet").toHaveBeenCalledTimes(3);
  });
});
