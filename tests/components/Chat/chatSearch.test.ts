// The shared chat search (components/Chat/chatSearch.ts).
//
// Regression guards. The bugs themselves were proved red first through both
// tabs in tests/components/Chat/pages/ContactLists.test.tsx and
// ChatLists.test.tsx; these pin the rules those tests rely on.
import { describe, expect, it } from "vitest";

import { contactUserId, dedupeContacts, directChatWith, normalizePhone, searchChatList } from "components/Chat/chatSearch";

describe("chatSearch — phone numbers", () => {
  it("reads a Syrian number the same in the international and the local form", () => {
    expect(normalizePhone("+963 944 555 666"), "the two forms of one Syrian number differ").toBe(normalizePhone("0944555666"));
  });

  it("reads an Iraqi number the same in the international and the local form", () => {
    expect(normalizePhone("+964 770 123 4567"), "the two forms of one Iraqi number differ").toBe(normalizePhone("07701234567"));
  });

  it("keeps two different numbers apart", () => {
    expect(normalizePhone("0944555666"), "two different numbers read the same").not.toBe(normalizePhone("0944555667"));
  });
});

describe("chatSearch — the user a contact points at", () => {
  it("reads the user from contact_user_id, sent as a string", () => {
    expect(contactUserId({ id: 55, contact_user_id: "8" }), "the user id was not read from contact_user_id").toBe(8);
  });

  it("reads the user from contact_user when contact_user_id is missing", () => {
    expect(contactUserId({ id: 55, contact_user: { id: 8 } }), "the user id was not read from contact_user").toBe(8);
  });

  it("never takes the contact record id for the user", () => {
    expect(contactUserId({ id: 55, contact_user_id: null }), "a person with no account got a user id").toBeNull();
  });
});

describe("chatSearch — one row per person", () => {
  it("keeps the contact with an account when the same phone is saved without one too", () => {
    const withoutAccount = { id: 1, contact_user_id: null, name: "Samer", mobile_phone: "0944555666" };
    const withAccount = { id: 2, contact_user_id: "9", name: "Samer", mobile_phone: "+963944555666" };
    expect(dedupeContacts([withoutAccount, withAccount]), "the contact with an account was dropped").toEqual([withAccount]);
  });
});

describe("chatSearch — which chat a contact leads to", () => {
  const me = 1;
  const orderChat = { id: 30, isPrivate: true, channel_members: [{ user_id: me }, { user_id: 8 }] };
  const directChat = { id: 40, channel_members: [{ user_id: me }, { user_id: 8 }] };

  it("leads to the direct chat, not an order chat with the same user", () => {
    expect(directChatWith([orderChat, directChat], 8)?.id, "a contact led to an order chat").toBe(40);
  });

  it("offers a new chat when the only chat with the user is an order chat", () => {
    const { contacts } = searchChatList({
      search: "bilal",
      chats: [orderChat],
      contacts: [{ id: 55, contact_user_id: "8", name: "bilal" }],
      meId: me,
    });
    expect(contacts.map((c: any) => c.name), "an order chat hid the offer to start a direct chat").toEqual(["bilal"]);
  });
});
