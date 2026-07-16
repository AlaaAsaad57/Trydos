"use client";

// Non-critical, render-null / post-hydration layout components are loaded here via
// next/dynamic with ssr:false. They are split out of the main layout bundle so they
// don't add to the synchronous hydration work that delays interactivity on first
// load and after each navigation. ssr:false is only allowed from a client component,
// which is why this wrapper exists (the root layout is a server component).

import dynamic from "next/dynamic";

const VersionChecker = dynamic(() => import("components/global/VersionChecker"), {
  ssr: false,
});
const SessionChecker = dynamic(() => import("components/SessionChecker"), {
  ssr: false,
});
const SessionTimer = dynamic(() => import("components/Login/SessionTimer"), {
  ssr: false,
});
const NotificationsContainer = dynamic(
  () => import("components/global/NotificationsContainer"),
  { ssr: false },
);

export default function DeferredLayoutClients() {
  return (
    <>
      <VersionChecker />
      <NotificationsContainer />
      <SessionChecker />
      <SessionTimer />
    </>
  );
}
