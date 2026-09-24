// The one search the chats tab and the contacts tab share.
//
// Both tabs sit under the same search box (ChatListSearch), so the same text
// must draw the same rows in both. They used to search differently: the chats
// tab matched a chat by the other user's name only, and a contact by its name
// only; the contacts tab matched a contact by name or phone. So "بلال" found a
// contact in one tab and nothing in the other, and a contact whose user already
// had a chat was offered as a new chat.
//
// The rows are: first the existing chats that match, then the contacts that
// match and have no chat yet. A chat matches by the other user's name or phone,
// or by the name or phone of the contact saved for that user.

/** The last 9 digits of a phone number.
 *
 *  Nine, not ten: a Syrian number is `+963 944 555 666` or `0944555666`, and
 *  only their last 9 digits agree. The same holds for Iraqi and Turkish
 *  numbers, whose last 9 digits are also the same in both formats. */
export const normalizePhone = (phone?: string | null): string => {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.length > 9 ? digits.slice(-9) : digits;
};

/** The user a contact points at, or null when the person has no account.
 *
 *  The contact search sends `contact_user_id` (often as a string); the saved
 *  contacts carry `contact_user.id`. `id` is the contact record, never the user. */
export const contactUserId = (contact: any): number | null =>
  parseInt(contact?.contact_user_id ?? contact?.contact_user?.id) || null;

/** One row per person: contacts with the same user or the same phone collapse
 *  into the first one seen, and one with an account wins over one without. */
export const dedupeContacts = <T>(contacts: T[] | null | undefined): T[] => {
  const kept: T[] = [];
  const byUser = new Map<number, number>();
  const byPhone = new Map<string, number>();

  for (const contact of contacts ?? []) {
    const user = contactUserId(contact);
    const phone = normalizePhone((contact as any)?.mobile_phone);
    const at =
      (user !== null ? byUser.get(user) : undefined) ??
      (phone ? byPhone.get(phone) : undefined);

    if (at === undefined) {
      kept.push(contact);
      if (user !== null) byUser.set(user, kept.length - 1);
      if (phone) byPhone.set(phone, kept.length - 1);
      continue;
    }
    if (contactUserId(kept[at]) === null && user !== null) kept[at] = contact;
    if (user !== null) byUser.set(user, at);
    if (phone) byPhone.set(phone, at);
  }
  return kept;
};

/** The direct chat with a user. An order chat with the same user does not count. */
export const directChatWith = (chats: any[], userId: number | null) =>
  userId === null
    ? undefined
    : chats.find(
        (chat) =>
          !chat.isPrivate &&
          chat.channel_members?.some((m: any) => parseInt(m.user_id) === userId),
      );

/** The chats and contacts a search draws, in the order they are drawn. */
export const searchChatList = ({
  search,
  chats,
  contacts,
  meId,
}: {
  search: string;
  chats: any[];
  contacts: any[];
  meId: number | string | undefined;
}) => {
  const text = search.trim().toLowerCase();
  const digits = text.replace(/\D/g, "");
  const matches = (name?: string, phone?: string) =>
    (name ?? "").toLowerCase().includes(text) ||
    (digits !== "" && String(phone ?? "").replace(/\D/g, "").includes(digits));

  const people = dedupeContacts(contacts);
  const me = parseInt(String(meId));

  const matchedChats = chats
    .filter((chat) => !chat.isPrivate || chat.channel_name !== "Delivery Worker")
    .filter((chat) => {
      const other = chat.channel_members?.find(
        (m: any) => parseInt(m.user_id) !== me,
      );
      if (!other) return false;
      if (matches(other.user?.name, other.user?.mobile_phone)) return true;
      return people.some(
        (p: any) =>
          contactUserId(p) === parseInt(other.user_id) &&
          matches(p.name, p.mobile_phone),
      );
    });

  const newContacts = people.filter(
    (p: any) =>
      matches(p.name, p.mobile_phone) &&
      !directChatWith(chats, contactUserId(p)),
  );

  return { chats: matchedChats, contacts: newContacts };
};
