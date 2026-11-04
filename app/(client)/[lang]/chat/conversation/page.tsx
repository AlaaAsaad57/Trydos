import { sendGuestToLogin } from "../chatGuestGate";

// Stage 6: the screen mount (components/DemoApp1/AppScreens.tsx) draws the new
// chat screen on this path, so the page itself renders nothing. It only sends
// a guest to the login page.

// TODO: Cache Components adoption. The guest check reads a cookie, as the
// settings pages do; refactor so this opt-out can be removed.
export const instant = false;

// A shopper's own chat: nothing here for a search engine.
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await searchParams;
  await sendGuestToLogin("chat/conversation", id);
  return null;
}
