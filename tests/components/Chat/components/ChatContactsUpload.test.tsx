// Adding contacts to chat (components/Chat/components/ChatContactsUpload.tsx):
// sync them from the phone's contact picker, or add one by hand.
//
// The chat backend calls go through `fetchData` and `getContacts`, both spies.
// jsdom has no Contacts API, so `navigator.contacts` is set per test.
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({
  fetchData: null as any,
  getContacts: null as any,
  logError: null as any,
  showError: null as any,
}));

vi.mock("utils/fetchData", () => ({ fetchData: (...a: any[]) => h.fetchData(...a) }));
vi.mock("store/chat/actions", () => ({ getContacts: (...a: any[]) => h.getContacts(...a) }));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => h.logError(...a),
}));
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...a: any[]) => h.showError(...a),
}));

import ChatContactsUpload from "components/Chat/components/ChatContactsUpload";

const SAVED = [
  { mobile_phone: "+963 912 345 678", name: "Stored Name", contact_user: { name: "Ali Saved" } },
  { mobile_phone: "+9630000", name: "Short" },
  { mobile_phone: "", name: "No phone" },
];

async function mount(contacts: any[] = SAVED) {
  return renderWithProviders(<ChatContactsUpload />, { store: { contacts } });
}

function setContactsApi(value: any) {
  Object.defineProperty(navigator, "contacts", { value, configurable: true });
}

beforeEach(() => {
  h.fetchData = vi.fn(async () => ({ success: true }));
  h.getContacts = vi.fn(async () => {});
  h.logError = vi.fn();
  h.showError = vi.fn();
});

afterEach(() => {
  delete (navigator as any).contacts;
});

describe("ChatContactsUpload — syncing from the phone", () => {
  it("merges the picked contacts with the saved ones and uploads each number once", async () => {
    setContactsApi({
      select: vi.fn(async () => [
        { name: ["Ali Saved Longer"], tel: ["+963 912 345 678"] },
        { name: ["New Person"], tel: ["+44 7000 000000"] },
        { name: "Dup", tel: "+44 7000 000000" },
        { name: [], tel: [] },
      ]),
    });
    await mount();
    await act(async () => {
      fireEvent.click(screen.getByText("Get From Your Contacts"));
    });
    const body = JSON.parse(h.fetchData.mock.calls[0][0].body);
    expect(body.contacts, "the merged list was not deduplicated by number, keeping the longest name").toEqual([
      { name: "Ali Saved Longer", mobile_phone: "+963912345678" },
      { name: "Short", mobile_phone: "+9630000" },
      { name: "New Person", mobile_phone: "+447000000000" },
    ]);
    expect(h.getContacts, "the contact list was not reloaded after the upload").toHaveBeenCalled();
  });

  it("does nothing when no contact was picked", async () => {
    setContactsApi({ select: vi.fn(async () => []) });
    await mount();
    await act(async () => {
      fireEvent.click(screen.getByText("Get From Your Contacts"));
    });
    expect(h.fetchData, "an empty pick was uploaded").not.toHaveBeenCalled();
    expect(screen.getByText("Get From Your Contacts"), "the button stayed in the syncing state").toBeInTheDocument();
  });

  it("tells the shopper when the browser has no contact picker", async () => {
    await mount();
    await act(async () => {
      fireEvent.click(screen.getByText("Get From Your Contacts"));
    });
    expect(h.showError, "the missing contact picker was not shown").toHaveBeenCalledWith("Contacts API Not Supported On This Browser");
  });

  it("tells the shopper when the chat backend refuses the upload", async () => {
    setContactsApi({ select: vi.fn(async () => [{ name: ["X"], tel: ["+447000000001"] }]) });
    h.fetchData = vi.fn(async () => ({ success: false, message: "contacts refused" }));
    await mount([]);
    await act(async () => {
      fireEvent.click(screen.getByText("Get From Your Contacts"));
    });
    expect(h.showError, "the refused upload was not shown").toHaveBeenCalledWith("contacts refused");
    expect(h.logError.mock.calls[0]?.[0]?.scenario, "the refused upload was not logged").toBe("sync contact - chat widget");
  });

  it("logs a failure that is not an Error", async () => {
    setContactsApi({ select: vi.fn(async () => { throw "picker closed"; }) });
    await mount();
    await act(async () => {
      fireEvent.click(screen.getByText("Get From Your Contacts"));
    });
    expect(h.logError.mock.calls[0]?.[0]?.error, "the picker failure was not logged").toBe("picker closed");
  });

  it("ignores a second press while a sync is running", async () => {
    let finish: any;
    setContactsApi({ select: vi.fn(() => new Promise((r) => (finish = r))) });
    await mount();
    const button = screen.getByText("Get From Your Contacts").closest("button")!;
    await act(async () => {
      fireEvent.click(button);
    });
    expect(screen.getByText("Syncing..."), "the syncing state was not shown").toBeInTheDocument();
    await act(async () => {
      button.disabled = false;
      fireEvent.click(button);
    });
    expect((navigator as any).contacts.select, "a second sync started while one was running").toHaveBeenCalledTimes(1);
    await act(async () => finish([]));
  });
});

describe("ChatContactsUpload — adding one by hand", () => {
  async function openForm(contacts?: any[]) {
    await mount(contacts);
    fireEvent.click(screen.getByText("Add Contact Manually"));
    return {
      name: screen.getByPlaceholderText("Enter Full Name"),
      phone: screen.getByPlaceholderText("123 4567"),
      dial: screen.getByRole("combobox") as HTMLSelectElement,
      confirm: screen.getByText("Confirm Add").closest("button")!,
    };
  }

  it("saves a new contact with the chosen dial code", async () => {
    const f = await openForm();
    expect(f.confirm, "confirm was enabled on an empty form").toBeDisabled();
    fireEvent.change(f.dial, { target: { value: "+44" } });
    fireEvent.change(f.name, { target: { value: " New <Person> " } });
    fireEvent.change(f.phone, { target: { value: "7000 000 002" } });
    await act(async () => {
      fireEvent.click(f.confirm);
    });
    expect(JSON.parse(h.fetchData.mock.calls[0][0].body), "the contact was not saved with its dial code").toEqual({
      name: "New Person",
      mobile_phone: "+447000000002",
    });
    expect(h.getContacts, "the list was not reloaded after the save").toHaveBeenCalled();
    expect(screen.getByText("Add Contact Manually"), "the form did not close after the save").toBeInTheDocument();
  });

  it("warns about a number that is already saved and refuses it", async () => {
    const f = await openForm();
    fireEvent.change(f.name, { target: { value: "Someone" } });
    fireEvent.change(f.phone, { target: { value: "912345678" } });
    expect(screen.getByText("Ali Saved"), "the saved name for the number was not shown").toBeInTheDocument();
    expect(f.confirm, "a number already saved could be added again").toBeDisabled();
    expect(f.phone.className, "the phone field was not marked as a conflict").toContain("border-orange-400");
  });

  it("does not save with a missing field, and the close button closes the form", async () => {
    const f = await openForm();
    fireEvent.change(f.phone, { target: { value: "7000000" } });
    await act(async () => {
      f.confirm.disabled = false;
      fireEvent.click(f.confirm);
    });
    expect(h.fetchData, "a contact with no name was saved").not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Add A New Contact").nextElementSibling as HTMLElement);
    expect(screen.getByText("Add Contact Manually"), "close did not close the form").toBeInTheDocument();
  });

  it("logs a failed save and keeps the form open", async () => {
    h.fetchData = vi.fn(async () => {
      throw new Error("save failed");
    });
    const f = await openForm([]);
    fireEvent.change(f.name, { target: { value: "Someone" } });
    fireEvent.change(f.phone, { target: { value: "7000000" } });
    await act(async () => {
      fireEvent.click(f.confirm);
    });
    expect(h.logError.mock.calls[0]?.[0]?.scenario, "a failed save was not logged").toBe("add contact - chat widget");
    expect(screen.getByText("Add A New Contact"), "the form closed after a failed save").toBeInTheDocument();
  });

  it("hides a flag that cannot load", async () => {
    await openForm();
    const flag = screen.getByAltText("flag") as HTMLImageElement;
    fireEvent.error(flag);
    expect(flag.style.display, "a broken flag was still shown").toBe("none");
  });

  it("falls back to the first country for an unknown dial code", async () => {
    const f = await openForm();
    fireEvent.change(f.dial, { target: { value: "+99999" } });
    expect((screen.getByAltText("flag") as HTMLImageElement).src, "an unknown dial code showed no flag").toMatch(/\/icons\/flag\/\w+\.svg$/);
  });

  it("BUG-chat-6: a contact the chat backend refused is not treated as saved", async () => {
    h.fetchData = vi.fn(async () => ({ success: false, message: "refused" }));
    const f = await openForm([]);
    fireEvent.change(f.name, { target: { value: "Someone" } });
    fireEvent.change(f.phone, { target: { value: "7000000" } });
    await act(async () => {
      fireEvent.click(f.confirm);
    });
    expect(screen.queryByText("Add A New Contact") !== null, "the form closed as if the refused contact was saved").toBe(true);
  });

  it("BUG-chat-7: a failed contact save tells the shopper", async () => {
    h.fetchData = vi.fn(async () => {
      throw new Error("save failed");
    });
    const f = await openForm([]);
    fireEvent.change(f.name, { target: { value: "Someone" } });
    fireEvent.change(f.phone, { target: { value: "7000000" } });
    await act(async () => {
      fireEvent.click(f.confirm);
    });
    await waitFor(() =>
      expect(
        screen.queryByText("Failed to add contact") !== null || h.showError.mock.calls.length > 0,
        "a failed save showed nothing to the shopper",
      ).toBe(true),
    );
  });
});
