import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import LandingPage from "./LandingPage";
import { useAppStore } from "store";
import { loginHref } from "utils/loginPath";

const CallContainer = dynamic(
  () => import("components/Chat/pages/CallContainer"),
  {
    loading: () => <LandingPage afterLoad={true} />,
  }
);
const ChatModal = dynamic(() => import("components/Chat/ChatModal"), {
  loading: () => <LandingPage afterLoad={true} />,
});

function AuthSections() {
  const loginOpen = useAppStore((s) => s.loginOpen);
  const setLoginOpen = useAppStore((s) => s.setLoginOpen);
  const chatOpen = useAppStore((s) => s.chatVar);
  const call = useAppStore((s) => s.call);
  const router = useRouter();
  const { lang } = useParams();

  // Every place that asks a guest to sign in sets `loginOpen`
  // (setLoginOpen(true)). The login is a page now, /[lang]/login (D-11 in
  // UI-MIGRATION-PLAN.md): the shopper goes there with this page as the way
  // back, and the flag is cleared, because nothing is open on this page.
  useEffect(() => {
    if (!loginOpen) return;
    setLoginOpen(false);
    const segment = typeof lang === "string" ? lang : "sy-en";
    const { pathname, search, hash } = window.location;
    // Already on the login page: there is nowhere else to go.
    if (pathname.replace(/\/$/, "") === `/${segment}/login`) return;
    router.push(loginHref(segment, `${pathname}${search}${hash}`));
  }, [loginOpen]);

  return (
    <>
      {chatOpen && <ChatModal />}
      {call && <CallContainer />}
    </>
  );
}

export default AuthSections;
