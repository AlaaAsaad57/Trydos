// The Kurdish file must show Kurdish on the chat swipe tiles.
//
// Why this matters: a block of `translations.ku.js` (the seller dashboard
// strings) was copied from the Turkish file. It wrote `Delete` a second time,
// as "Sil". The last copy of a key wins, so Kurdish users saw the Turkish "Sil"
// on the Delete tile in the chat list. The parity check cannot see this: the
// key is there, only its value is in the wrong language.
//
// Kurdish (Sorani) is written in Arabic script, so a Latin letter in one of
// these values means it came from another language file.
//
// What a failure here means: the named tile label is not Kurdish. Fix the value
// in `public/translations/translations.ku.js`, and look for a second copy of
// the key further down the file.
import { describe, expect, it } from "vitest";

import translations from "../../public/translations/translations.ku.js";

const ku = translations as Record<string, string>;

/** The labels `components/Chat/components/ChatOptions.tsx` shows on the tiles. */
const CHAT_TILE_KEYS = ["Read", "Unread", "Pin", "Unpin", "Mute", "Unmute", "Delete", "Archive", "Unarchive"];

describe("translations.ku.js", () => {
  it("shows the chat swipe tiles in Kurdish, not in Turkish", () => {
    const notKurdish = CHAT_TILE_KEYS.filter((key) => !ku[key] || /[A-Za-z]/.test(ku[key])).map(
      (key) => `${key} => ${JSON.stringify(ku[key])}`,
    );
    expect(notKurdish, `these chat tile labels are not Kurdish:\n${notKurdish.join("\n")}`).toEqual([]);
  });
});
