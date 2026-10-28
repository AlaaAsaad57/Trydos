import { useAppStore } from "store";
import { clearAllUserData } from "utils/tinyUtils";

// The logout row of the new profile screen (D-22, D-23). The same steps as the
// old account menu's logout (`components/Home/Menu.tsx`, gone with the old top
// nav): clear the session (`clearAllUserData` calls /api/auth/logout and
// posthogReset), reset the store's auth state in full, then go to the
// storefront, because the profile is a private page.
//
// A guest has no account to sign out of, so the row does nothing for a guest:
// a logout would only throw away the guest's session and cart. The old menu
// did not offer logout to a guest for the same reason.
export async function logoutFromProfile(lang: string): Promise<void> {
  const state = useAppStore.getState();
  if (state.LoggingOut) return;
  const phone = state.userProfile?.phone;
  if (!phone || phone === "0") return;

  state.setLoggingOut(true);
  await clearAllUserData();
  // No argument: a full reset, not "expired".
  useAppStore.getState().cancelAuth();
  window.location.href = `/${lang}`;
}
