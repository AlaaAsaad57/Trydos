// The link rules for a new story. One copy for the shopper's Add Story widget
// and the seller dashboard, so both forms accept and refuse the same links.

export const MAX_STORY_LINK_LENGTH = 200;

/** Adds https:// when the link has no http:// or https:// of its own. */
const withScheme = (raw: string) =>
  raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;

const isUrl = (link: string) => {
  // A host with no dot ("localhost", "notalink") is not a shop link.
  if (link.split(".").length < 2) return false;
  try {
    new URL(link);
    return true;
  } catch {
    return false;
  }
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
export const checkStoryLink = (raw: string): StoryLinkCheck => {
  if (!raw) {
    return { empty: true, link: "", length: 0, isUrl: true, isShort: true, valid: true };
  }
  const link = withScheme(raw);
  const url = isUrl(link);
  const short = link.length <= MAX_STORY_LINK_LENGTH;
  return { empty: false, link, length: link.length, isUrl: url, isShort: short, valid: url && short };
};
