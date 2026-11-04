import { canonicalPhone, phoneRegion, type PhoneRegion } from "components/Chat/contactPhone";
import { useAppStore } from "store";
import { getContacts } from "store/chat/actions";
import { showErrorNotification, showSuccessNotification } from "store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { LogError, translateFunction } from "utils/functions";
import { REQUESTS_DATA } from "utils/Requests";

/*
  Saving the phone's contacts to the chat backend (/api/v1/users/save_contacts),
  moved out of components/Chat/components/ChatContactsUpload.tsx so the new
  chat screens can use it too (Stage 6, step 6).
*/

/**
 * Merges the saved contacts with the ones picked from the phone, one entry
 * per number. Numbers are compared in their full international form, so the
 * phone book's "0937288307" is the saved "963937288307".
 *
 * - A saved contact keeps its saved number, so the backend sees the same record.
 * - A saved contact keeps its saved name: the import never renames it. A
 *   picked name fills a saved contact only when it has no name.
 * - Among picks for one new number, the longest name wins.
 * - A new number is sent in its full form, and every number of a picked
 *   contact is imported, not only the first.
 * - The shopper's own number (`ownPhone`, full form) is never imported.
 *
 * `alreadySaved` holds the saved number of every pick that was saved before.
 */
export const mergeContacts = (
  saved: any[],
  picked: any[],
  region: PhoneRegion,
  ownPhone: string,
) => {
  const byPhone = new Map<string, { name: string; mobile_phone: string }>();
  // Numbers whose name came from the phone book, not from a saved contact.
  const namedByPick = new Set<string>();
  const savedKeys = new Set<string>();
  const alreadySaved = new Set<string>();

  saved.forEach((c) => {
    const key = canonicalPhone(c.mobile_phone, region);
    if (!key || byPhone.has(key)) return;
    savedKeys.add(key);
    byPhone.set(key, {
      name: String(c.name ?? "").trim(),
      mobile_phone: String(c.mobile_phone).replace(/\s+/g, ""),
    });
  });

  picked.forEach((c) => {
    const name = String((Array.isArray(c.name) ? c.name[0] : c.name) ?? "").trim();
    const tels = Array.isArray(c.tel) ? c.tel : [c.tel];
    tels.forEach((tel: string) => {
      const key = canonicalPhone(tel, region);
      if (!key || key === ownPhone) return;
      const entry = byPhone.get(key);
      if (entry && savedKeys.has(key)) alreadySaved.add(entry.mobile_phone);
      if (!entry) {
        byPhone.set(key, { name, mobile_phone: key });
        namedByPick.add(key);
      } else if (
        !entry.name ||
        (namedByPick.has(key) && name.length > entry.name.length)
      ) {
        entry.name = name;
        namedByPick.add(key);
      }
    });
  });

  return {
    contacts: Array.from(byPhone.values()),
    alreadySaved: Array.from(alreadySaved),
  };
};

/** True when the browser can read the phone's contacts (the Contact Picker API). */
export const canPickContacts = () => typeof navigator !== "undefined" && "contacts" in navigator;

/**
 * Lets the shopper pick contacts from the phone and saves them with the ones
 * already saved, one entry per number, as the old "Get from your contacts"
 * button did. Says which picks were saved before.
 */
export async function syncPhoneContacts(): Promise<void> {
  const { contacts, userChat, user, country } = useAppStore.getState() as any;
  const region = phoneRegion(userChat?.mobile_phone ?? user?.phone, country);
  const ownPhone = canonicalPhone(userChat?.mobile_phone || user?.phone, region);
  try {
    if (!canPickContacts()) throw new Error(translateFunction("Contacts API not supported on this browser"));
    const picked = await (navigator as any).contacts.select(["name", "tel"], { multiple: true });
    if (!picked?.length) return;
    const { contacts: payload, alreadySaved } = mergeContacts(contacts ?? [], picked, region, ownPhone);
    const res = await fetchData({
      url: "/api/v1/users/save_contacts",
      server: "chat",
      method: "POST",
      body: JSON.stringify({ contacts: payload }),
      reqTitle: REQUESTS_DATA.SAVE_CONTACTS,
    });
    if (!res.success) throw new Error(res.message);
    await getContacts();
    if (alreadySaved.length) showSuccessNotification(translateFunction("Some contacts already exist"));
  } catch (error) {
    // A1-12: the contacts' names and numbers must not reach Sentry.
    LogError({ error, scenario: "syncPhoneContacts (new chat screens)" });
    showErrorNotification(error instanceof Error ? error.message : translateFunction("Failed to add contact"));
  }
}
