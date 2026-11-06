"use client";

import InitFunction from "./InitFunction";
import AuthSections from "./AuthSections";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import StoryViewerSkeleton from "components/skeleton/StoryViewerSkeleton";
import { CoverBox } from "components/global/PageCover";
import { LoginSkeleton } from "components/skeleton/pageShapes";

function AuthLoader() {
  return (
    <CoverBox>
      <LoginSkeleton />
    </CoverBox>
  );
}

// Lazy: these two bring the whole login flow (phone numbers, QR code, the
// scaled canvas, the logo animation), about 90 KB on every page, and almost no
// visit opens them. Until the code is here the shopper sees the login's own
// skeleton. PageWarmup loads the phone check after the page is ready.
const ConfirmMobilePhoneWidget = dynamic(
  () => import("components/Login/ConfirmMobilePhoneWidget"),
  { ssr: false, loading: () => <AuthLoader /> },
);
const SessionExpiredWidget = dynamic(
  () => import("components/Login/SessionExpiredWidget"),
  { ssr: false, loading: () => <AuthLoader /> },
);

// Lazy: the stories viewer drags react-cube-navigation (+ react-spring,
// react-gesture-responder) and react-swipeable; a static import would ship
// them on every page since NavbarClient is mounted in the root layout.
const StoriesContainer = dynamic(() => import("./Stories/NewStories"), {
  ssr: false,
  loading: () => <StoryViewerSkeleton />,
});

function NavbarClient() {
  // Per-field selectors: this component is mounted on every page, so a
  // whole-store subscription would re-render it on any store write.
  const shouldAuthinticated = useAppStore((s) => s.shouldAuthinticated);
  const loginOpen = useAppStore((s) => s.loginOpen);
  const selectedStory = useAppStore((s) => s.selectedStory);
  const LoggingOut = useAppStore((s) => s.LoggingOut);
  const isProductPage = useAppStore((s) => s.isProductPage);
  const { lang } = useParams();

  return (
    <>
      <InitFunction init={lang} />

      <AuthSections />
      {/* One scaled canvas at a time: AppScaler hardcodes #app-outer /
          #master-canvas and writes --app-scale on :root, so two mounted
          together fight over both. The login widget wins — its VerifyOtp
          already clears `shouldAuthinticated` and sets reAuthResult
          "success", so a parked 401 resolves through it too. */}
      {/* "expired" = the session-expired "please login again" prompt; its
          Login button re-arms the marker as `true`, which swaps in the
          phone-verify widget below. */}
      {!loginOpen && shouldAuthinticated === "expired" && !LoggingOut && (
        <SessionExpiredWidget />
      )}
      {!loginOpen &&
        shouldAuthinticated &&
        shouldAuthinticated !== "expired" &&
        !LoggingOut && <ConfirmMobilePhoneWidget />}
      {selectedStory?.id && !isProductPage && (
        <StoriesContainer selectedStory={selectedStory} />
      )}
    </>
  );
}

export default NavbarClient;
