// The link rules for a new story. One copy for the shopper's Add Story widget
// and the seller dashboard, so both forms accept and refuse the same links.

export const MAX_STORY_LINK_LENGTH = 200;

/**
 * Cleans what is typed in a story's link field. Removes only < and >, the
 * characters that could start HTML. The shared input cleaner (pollinateInput)
 * also removes & # % ( ) , and others, which breaks a link's query, its #part
 * and its %-codes, so the link fields do not use it.
 */
export const cleanStoryLink = (value: string): string =>
  typeof value === "string" ? value.replace(/[<>]/g, "") : "";

/** Adds https:// when the link has no http:// or https:// of its own (any case). */
const withScheme = (raw: string) => (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);

// One part of a host name: letters, digits and dashes, 1 to 63 characters,
// no dash at the start or the end. The URL parser gives the host in ASCII,
// so an Arabic host is already "xn--..." here.
const HOST_PART = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
// The ending (".com", ".co.uk"'s "uk"): two or more letters, or an "xn--"
// ending for a non-Latin one. A digit ending means an IP address.
const HOST_ENDING = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

// The browser's URL parser takes far too much ("example.", "-shop.com",
// "1.2", "trydos.com@evil.com"), so the host is checked here on its own.
const isUrl = (link: string) => {
  if (/\s/.test(link)) return false;
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return false;
  }
  // A user name before the host hides the real one: "trydos.com@evil.com".
  if (url.username || url.password) return false;
  const host = url.hostname;
  if (host.length > 253) return false;
  const parts = host.split(".");
  // A host with no dot ("localhost", "notalink", "ftp" in "ftp://...") is not a shop link.
  if (parts.length < 2) return false;
  return parts.every((part) => HOST_PART.test(part)) && HOST_ENDING.test(parts[parts.length - 1]);
};

export type StoryLinkCheck = {
  /** Nothing typed. The link is optional, so this is fine. */
  empty: boolean;
  /** The link as it is sent, with https:// added when missing. */
  link: string;
  /** Length of `link`, the https:// we add included. */
  length: number;
  isUrl: boolean;
  isShort: boolean;
  /** Empty, or passes both rules. */
  valid: boolean;
};

// The two rules are judged apart, so a link that is bad AND too long
// fails both. One rule never hides the other.
export const checkStoryLink = (typed: string): StoryLinkCheck => {
  // Spaces around a pasted link are not part of it.
  const raw = typed.trim();
  if (!raw) {
    return { empty: true, link: "", length: 0, isUrl: true, isShort: true, valid: true };
  }
  const link = withScheme(raw);
  const url = isUrl(link);
  const short = link.length <= MAX_STORY_LINK_LENGTH;
  return { empty: false, link, length: link.length, isUrl: url, isShort: short, valid: url && short };
};
