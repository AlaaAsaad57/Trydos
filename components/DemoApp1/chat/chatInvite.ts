import { translateFunction } from "utils/functions";
import type { InviteContact } from "./chatModel";

/**
 * The invite to a phone-book contact who is not on Trydos: the old chat's words
 * and links (SearchResult.tsx). The name and the links go into the translated
 * words as functions, so a "$" in a name stays as it is.
 */

/** The Play Store line. With no NEXT_PUBLIC_PLAY_STORE_URL there is no line, not a dead link. */
const getTheApp = () => {
  const url = process.env.NEXT_PUBLIC_PLAY_STORE_URL;
  return url ? ` \n ${translateFunction("Get the app: {link}").replace("{link}", () => url)}` : "";
};

/** The invite in the app's language. */
export const inviteText = () =>
  `${translateFunction("Hey! Join us at {link}").replace("{link}", () => window.location.origin)}${getTheApp()}`;

const telegramText = (name: string) =>
  `${translateFunction("Hey {name}! Join us at {link}")
    .replace("{name}", () => name)
    .replace("{link}", () => window.location.origin)}${getTheApp()}`;

export const whatsappInviteLink = (contact: InviteContact) =>
  `https://wa.me/${contact.fullPhone || contact.phone}?text=${encodeURIComponent(inviteText())}`;

/**
 * The contact's own Telegram chat with the invite in its text box. A contact
 * with no real number gets Telegram's share page: the shopper picks the chat.
 */
export const telegramInviteLink = (contact: InviteContact) => {
  const text = encodeURIComponent(telegramText(contact.name));
  return contact.fullPhone
    ? `https://t.me/+${contact.fullPhone}?text=${text}`
    : `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${text}`;
};

const isPhone = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/**
 * Opens the phone's own share with the invite. Says false where there is none
 * (a computer): the screen then shows its own choices. A shopper who cancels
 * the share has answered, so that counts as true.
 *
 * The share starts before the first `await`, while the tap still counts: a
 * browser refuses a share that starts later.
 */
export async function shareInvite(contact: InviteContact): Promise<boolean> {
  if (!isPhone() || !navigator.share) return false;
  try {
    await navigator.share({
      title: translateFunction("Join {name} on Trydos").replace("{name}", () => contact.name),
      text: inviteText(),
    });
  } catch {
    // The shopper closed the share.
  }
  return true;
}
