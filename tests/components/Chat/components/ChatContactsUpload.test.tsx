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

async function mount(contacts: any[] = SAVED, store: Record<string, any> = {}, props: Record<string, any> = {}) {
  return renderWithProviders(<ChatContactsUpload {...props} />, { store: { contacts, ...store } });
}

/** Opens the add-by-hand form and returns its fields. */
async function openForm(contacts?: any[], store?: Record<string, any>, props?: Record<string, any>) {
  await mount(contacts, store, props);
  fireEvent.click(screen.getByText("Add Contact Manually"));
  return {
    name: screen.getByPlaceholderText("Enter Full Name"),
    phone: screen.getByPlaceholderText("123 4567"),
    dial: screen.getByRole("combobox") as HTMLSelectElement,
    confirm: screen.getByText("Confirm Add").closest("button")!,
  };
}

async function syncPicked(picked: any[]) {
  setContactsApi({ select: vi.fn(async () => picked) });
  await act(async () => {
    fireEvent.click(screen.getByText("Get From Your Contacts"));
  });
  return JSON.parse(h.fetchData.mock.calls[0][0].body).contacts;
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
    expect(body.contacts, "the merged list was not deduplicated by number, keeping the saved name").toEqual([
      { name: "Stored Name", mobile_phone: "+963912345678" },
      { name: "Short", mobile_phone: "+9630000" },
      { name: "New Person", mobile_phone: "447000000000" },
    ]);
    expect(h.getContacts, "the contact list was not reloaded after the upload").toHaveBeenCalled();
  });

  // A phone book keeps local numbers ("0937288307"); the chat backend keeps
  // full ones ("963937288307"). They are the same person, in every country.
  it.each([
    ["Syria", "963944000001", "963937288307", "0937288307"],
    ["Iraq", "9647700000001", "9647701234567", "0770 123 4567"],
    ["Turkey", "905300000001", "905321234567", "0532 123 45 67"],
  ])("%s: a local number in the phone book is the saved contact with the full number", async (_, own, saved, local) => {
    await mount([{ mobile_phone: saved, name: "alaa" }], { userChat: { mobile_phone: own } });
    const contacts = await syncPicked([{ name: ["Alaa Asaad"], tel: [local] }]);
    expect(contacts, `"${local}" was uploaded as a second contact beside "${saved}", or renamed it`).toEqual([
      { name: "alaa", mobile_phone: saved },
    ]);
  });

  it("gives a saved contact with no name the name from the phone book", async () => {
    await mount([{ mobile_phone: "963937288307", name: "" }], { userChat: { mobile_phone: "963944000001" } });
    const contacts = await syncPicked([{ name: ["Alaa Asaad"], tel: ["0937288307"] }]);
    expect(contacts, "a saved contact with no name stayed nameless after the import").toEqual([
      { name: "Alaa Asaad", mobile_phone: "963937288307" },
    ]);
  });

  it("reads a local number in the country of the shopper's own phone, not the app region", async () => {
    await mount([], { userChat: { mobile_phone: "963944000001" }, country: "iq" });
    const contacts = await syncPicked([{ name: ["Alaa"], tel: ["0937288307"] }]);
    expect(contacts, "a local number was not read as Syrian for a shopper with a Syrian phone").toEqual([
      { name: "Alaa", mobile_phone: "963937288307" },
    ]);
  });

  it("reads a local number in the app region when the shopper's own phone is not known", async () => {
    await mount([], { country: "iq" });
    const contacts = await syncPicked([{ name: ["Ali"], tel: ["07701234567"] }]);
    expect(contacts, "a local number was not read as Iraqi in the iq region").toEqual([
      { name: "Ali", mobile_phone: "9647701234567" },
    ]);
  });

  it("keeps the country code of a number from another country", async () => {
    await mount([], { userChat: { mobile_phone: "963944000001" } });
    const contacts = await syncPicked([
      { name: ["UK friend"], tel: ["+44 7911 123456"] },
      { name: ["Iraq friend"], tel: ["00964 770 123 4567"] },
    ]);
    expect(contacts, "a foreign number lost or changed its country code").toEqual([
      { name: "UK friend", mobile_phone: "447911123456" },
      { name: "Iraq friend", mobile_phone: "9647701234567" },
    ]);
  });

  it("imports every number of a picked contact, not only the first", async () => {
    await mount([], { userChat: { mobile_phone: "963944000001" } });
    const contacts = await syncPicked([{ name: ["Alaa"], tel: ["011 222 3333", "0937288307"] }]);
    expect(
      contacts.map((c: any) => c.mobile_phone),
      "the second number of a picked contact was dropped",
    ).toContain("963937288307");
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
      mobile_phone: "447000000002",
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
    expect(f.phone.className, "the phone field was not marked red as a conflict").toContain("border-red-400");
    expect(
      screen.getByText("Ali Saved").closest("div")!.className,
      "the 'Already saved as' line was not red",
    ).toContain("text-red-600");
    await act(async () => {
      f.confirm.disabled = false;
      fireEvent.click(f.confirm);
    });
    expect(h.fetchData, "a number already saved was sent to the chat backend").not.toHaveBeenCalled();
  });

  it("BUG-1: refuses a saved number whose contact has no name", async () => {
    const f = await openForm([{ id: 7, mobile_phone: "963937288307", name: "" }], {
      userChat: { mobile_phone: "963944000001" },
    });
    fireEvent.change(f.name, { target: { value: "Alaa" } });
    fireEvent.change(f.phone, { target: { value: "0937288307" } });
    expect(f.confirm, "a saved contact with no name could be added again").toBeDisabled();
    expect(
      screen.queryByText("963937288307"),
      "the warning did not name the nameless contact by its phone, as its row does",
    ).toBeInTheDocument();
    await act(async () => {
      f.confirm.disabled = false;
      fireEvent.click(f.confirm);
    });
    expect(h.fetchData, "a saved contact with no name was sent to the chat backend again").not.toHaveBeenCalled();
  });

  it("warns about a saved number typed with the local 0", async () => {
    const f = await openForm([{ mobile_phone: "963937288307", name: "alaa" }]);
    fireEvent.change(f.name, { target: { value: "Alaa Asaad" } });
    fireEvent.change(f.phone, { target: { value: "0937288307" } });
    expect(screen.queryByText("alaa"), "+963 0937288307 was not seen as the saved 963937288307").toBeInTheDocument();
    expect(f.confirm, "a saved number typed with the local 0 could be added again").toBeDisabled();
  });

  it("saves a number typed with the local 0 in its full form", async () => {
    const f = await openForm([]);
    fireEvent.change(f.name, { target: { value: "Alaa" } });
    fireEvent.change(f.phone, { target: { value: "0937288307" } });
    await act(async () => {
      fireEvent.click(f.confirm);
    });
    expect(
      JSON.parse(h.fetchData.mock.calls[0][0].body).mobile_phone,
      "the local 0 was kept after the country code",
    ).toBe("963937288307");
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

// The form tells the contact list which row has the typed number
// (`onDuplicate`), so the list can draw it first with a red frame. The warning
// names that contact the way its row in the list does.
describe("ChatContactsUpload — the contact that already has the number", () => {
  const SY = { userChat: { id: 1, mobile_phone: "963944000001" } };
  const alaa = { id: 1, contact_user_id: null, name: "alaa", mobile_phone: "963937288307" };
  const samer = { id: 60, contact_user_id: null, name: "سامر", mobile_phone: "+963 944 555 666" };
  const samerAgain = { id: 61, contact_user_id: null, name: "سامر", mobile_phone: "0944555666" };

  async function typing(contacts: any[], store: Record<string, any> = SY) {
    const onDuplicate = vi.fn();
    const f = await openForm(contacts, store, { onDuplicate });
    fireEvent.change(f.name, { target: { value: "Someone" } });
    const type = (value: string) => fireEvent.change(f.phone, { target: { value } });
    /** What the list was told, from the first match on. */
    const reportsSinceMatch = () => {
      const calls = onDuplicate.mock.calls.map((c) => c[0]);
      return calls.slice(calls.findIndex(Boolean));
    };
    return { f, type, onDuplicate, reportsSinceMatch };
  }

  it("reports the same row once while the typed number still matches it", async () => {
    const t = await typing([alaa]);
    t.type("0937288307");
    t.type("937288307");
    expect(
      t.reportsSinceMatch().map((row) => row?.id ?? null),
      "the matched row was reported again, or dropped, while the number still matched it",
    ).toEqual([1]);
  });

  it("reports no match when the number changes to an unsaved one, is cleared, or the form closes", async () => {
    const t = await typing([alaa]);
    t.type("0937288307");
    expect(t.onDuplicate.mock.lastCall?.[0]?.id, "the saved number was not reported to the list").toBe(1);
    t.type("0937000000");
    expect(t.onDuplicate.mock.lastCall?.[0], "an unsaved number still marked the old contact").toBeNull();
    t.type("0937288307");
    t.type("");
    expect(t.onDuplicate.mock.lastCall?.[0], "a cleared number still marked the old contact").toBeNull();
    t.type("0937288307");
    fireEvent.click(screen.getByText("Add A New Contact").nextElementSibling as HTMLElement);
    expect(t.onDuplicate.mock.lastCall?.[0], "closing the form still marked the old contact").toBeNull();
  });

  it("reports contact B after the number changes from A's to B's", async () => {
    const t = await typing([alaa, samer]);
    t.type("0937288307");
    t.type("0944555666");
    expect(
      t.reportsSinceMatch().map((row) => row?.id ?? null),
      "the list was not told A, then B",
    ).toEqual([1, 60]);
  });

  it("reports the drawn row when the person is saved twice in two formats", async () => {
    const t = await typing([samer, samerAgain]);
    t.type("0944555666");
    expect(
      t.onDuplicate.mock.lastCall?.[0]?.id,
      "the list was told a record it does not draw, so no row would be marked",
    ).toBe(60);
  });

  it("names a contact the shopper chats with as the chat row does, not by the account name", async () => {
    const qussai = {
      id: 5,
      contact_user_id: "8",
      contact_user: { id: 8, name: "qussai2" },
      name: "قصي",
      mobile_phone: "963984902640",
    };
    const chat = {
      id: 40,
      channel_name: "قصي بدوي",
      channel_members: [
        { user_id: 1, user: { name: "Me" } },
        { user_id: 8, user: { name: "qussai2", mobile_phone: "963984902640" } },
      ],
    };
    const t = await typing([qussai], { ...SY, data: [chat] });
    t.type("984902640");
    expect(screen.queryByText("قصي بدوي"), "the warning did not use the chat row's name").toBeInTheDocument();
    expect(screen.queryByText("qussai2"), "the warning showed the account name, which no row shows").toBeNull();
  });

  it("names a contact with no chat as its row does", async () => {
    const t = await typing([samer]);
    t.type("0944555666");
    expect(screen.queryByText("سامر"), "the warning did not use the contact row's name").toBeInTheDocument();
  });
});
