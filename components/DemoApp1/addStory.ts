import { useAppStore } from "store";
import { isGuestName } from "utils/tinyUtils";

/**
 * The rules of the "add story" card on the new home (S7-5). They are the live
 * tile's rules (components/Home/AddStory.tsx), unchanged.
 */

/**
 * The card shows only for a shopper the core backend allows to post stories
 * (`is_allowed_to_upload_story` on the profile: 1, "1" or true).
 */
export function canAddStory(profile: any): boolean {
  const allowed = profile?.is_allowed_to_upload_story;
  if (allowed === null || allowed === undefined) return false;
  if (allowed === 0) return false;
  return allowed === true || allowed === 1 || parseInt(allowed) === 1;
}

/** A phone number of 3 characters or more that is not the guest's "0". */
function hasPhone(user: any): boolean {
  const phone = user?.phone;
  return (
    phone !== "0" &&
    phone !== 0 &&
    phone !== null &&
    phone !== undefined &&
    String(phone).trim() !== "" &&
    String(phone).length >= 3
  );
}

/**
 * A tap on the card:
 *  - while a new story uploads: nothing;
 *  - no phone (a guest): the login page (`setLoginOpen`, which AuthSections
 *    turns into /[lang]/login with this page as the way back);
 *  - a stories session that needs a new sign-in: the phone re-verify;
 *  - no real name yet: the name prompt;
 *  - else: the add-story sheet.
 */
export function startAddStory(): void {
  const s = useAppStore.getState();
  if (s.storiesRefreshing) return;
  const user = s.userProfile || s.user;
  if (!user || !hasPhone(user)) {
    s.setLoginOpen(true);
    return;
  }
  if (s.userStories && !s.userStories?.need_auth) {
    if (user?.name?.length > 0 && !isGuestName(user?.name)) s.setAddStory(true);
    else s.setNameModal(true);
  } else {
    s.setShouldAuthinticated("open Story");
  }
}
