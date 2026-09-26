// The tag picker and the reminder picker that the message menu opens
// (components/Chat/components/messages/MessageTagPicker.tsx and
// MessageReminderPicker.tsx).
//
// The chat backend calls are stand-ins that record what they were asked, so
// each test reads exactly what the picker would send.
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../../render";

const h = vi.hoisted(() => ({
  toggle: vi.fn(async (..._a: any[]) => true),
  setReminder: vi.fn(async (..._a: any[]) => true),
  cancelReminder: vi.fn(async (..._a: any[]) => true),
}));

vi.mock("store/chat/actions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  ToggleMessageTag: (...a: any[]) => h.toggle(...a),
  SetMessageReminder: (...a: any[]) => h.setReminder(...a),
  CancelMessageReminder: (...a: any[]) => h.cancelReminder(...a),
}));

import MessageTagPicker from "components/Chat/components/messages/MessageTagPicker";
import MessageReminderPicker from "components/Chat/components/messages/MessageReminderPicker";

const ME = 657;
const THEM = 672;

beforeEach(() => {
  h.toggle.mockClear();
  h.setReminder.mockClear();
  h.cancelReminder.mockClear();
});

describe("the tag picker", () => {
  async function mountTags(onClose = vi.fn()) {
    await renderWithProviders(
      <MessageTagPicker
        open={true}
        onClose={onClose}
        channelId={539}
        messageId="339827"
        tags={[
          { tag: "urgent", count: 1, user_ids: [ME] },
          { tag: "todo", count: 1, user_ids: [THEM] },
        ]}
        myId={ME}
      />,
      { store: { userChat: { id: ME } } },
    );
    return { onClose };
  }

  it("marks only the tags I put on the message", async () => {
    await mountTags();
    expect(
      document
        .querySelector('[data-pw="MESSAGE-TAG-urgent"]')
        ?.getAttribute("aria-pressed"),
      "a tag I put on the message was not marked as mine",
    ).toBe("true");
    expect(
      document
        .querySelector('[data-pw="MESSAGE-TAG-todo"]')
        ?.getAttribute("aria-pressed"),
      "a tag only the other person used was marked as mine",
    ).toBe("false");
  });

  it("toggles the pressed tag on the chat backend and stays open", async () => {
    const { onClose } = await mountTags();
    await act(async () => {
      fireEvent.click(
        document.querySelector('[data-pw="MESSAGE-TAG-important"]')!,
      );
    });
    expect(
      h.toggle,
      "the tag was not sent to the chat backend",
    ).toHaveBeenCalledWith(539, "339827", "important");
    expect(
      onClose,
      "the picker closed after one tag, so a second could not be changed",
    ).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Close"));
    expect(onClose, "Close did not close the picker").toHaveBeenCalled();
  });
});

describe("the reminder picker", () => {
  async function mountReminder(reminder: any = null, onClose = vi.fn()) {
    await renderWithProviders(
      <MessageReminderPicker
        open={true}
        onClose={onClose}
        channelId={539}
        messageId="339827"
        reminder={reminder}
      />,
      { store: { userChat: { id: ME } } },
    );
    return { onClose };
  }

  it("sets a quick choice about an hour from now and closes", async () => {
    const { onClose } = await mountReminder();
    const before = Date.now();
    await act(async () => fireEvent.click(screen.getByText("In 1 Hour")));
    const [channelId, messageId, at] = h.setReminder.mock.calls[0] ?? [];
    expect(
      [channelId, messageId],
      "the reminder went to the wrong message",
    ).toEqual([539, "339827"]);
    const minutes = ((at as Date).getTime() - before) / 60000;
    expect(
      minutes >= 59 && minutes <= 61,
      `"In 1 Hour" asked for a time ${minutes} minutes away`,
    ).toBe(true);
    await waitFor(() =>
      expect(
        onClose,
        "the picker stayed open after the reminder was saved",
      ).toHaveBeenCalled(),
    );
  });

  it("refuses a time in the past without asking the chat backend", async () => {
    await mountReminder();
    fireEvent.change(document.querySelector("#message-reminder-custom")!, {
      target: { value: "2020-01-01T09:00" },
    });
    await act(async () => fireEvent.click(screen.getByText("Set")));
    expect(
      screen.getByRole("alert").textContent,
      "a past time was not refused",
    ).toBe("Choose A Time In The Future");
    expect(
      h.setReminder,
      "a past time was sent to the chat backend, which refuses it",
    ).not.toHaveBeenCalled();
  });

  it("refuses a time the chat backend cannot store (2038 and later)", async () => {
    await mountReminder();
    fireEvent.change(document.querySelector("#message-reminder-custom")!, {
      target: { value: "2038-02-01T09:00" },
    });
    await act(async () => fireEvent.click(screen.getByText("Set")));
    expect(
      screen.getByRole("alert").textContent,
      "a time after 2038-01-19 was not refused",
    ).toBe("Choose An Earlier Time");
    expect(
      h.setReminder,
      "a time after 2038-01-19 was sent to the chat backend",
    ).not.toHaveBeenCalled();
  });

  it("shows the reminder the message has, and cancels it by its id", async () => {
    const { onClose } = await mountReminder({
      id: "r-9",
      remind_at: "2030-01-15T12:30:00",
      created_at: "2030-01-15T10:00:00",
    });
    expect(
      screen.getByText(/Reminder Set For/),
      "the picker did not show the reminder the message already has",
    ).toBeInTheDocument();
    await act(async () =>
      fireEvent.click(
        document.querySelector('[data-pw="MESSAGE-REMINDER-CANCEL"]')!,
      ),
    );
    expect(
      h.cancelReminder,
      "the reminder was not cancelled by its own id",
    ).toHaveBeenCalledWith(539, "339827", "r-9");
    await waitFor(() =>
      expect(
        onClose,
        "the picker stayed open after the cancel",
      ).toHaveBeenCalled(),
    );
  });

  it("stays open when the chat backend refuses the reminder", async () => {
    h.setReminder.mockResolvedValueOnce(false);
    const { onClose } = await mountReminder();
    await act(async () => fireEvent.click(screen.getByText("In 3 Hours")));
    expect(h.setReminder, "the reminder was not sent").toHaveBeenCalled();
    expect(
      onClose,
      "a refused reminder closed the picker as if it was saved",
    ).not.toHaveBeenCalled();
  });
});
