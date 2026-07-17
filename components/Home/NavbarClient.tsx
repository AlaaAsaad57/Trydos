"use client";

import InitFunction from "./InitFunction";
import AuthSections from "./AuthSections";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import ConfirmMobilePhoneWidget from "components/Login/ConfirmMobilePhoneWidget";
import dynamic from "next/dynamic";
import StoryViewerSkeleton from "components/skeleton/StoryViewerSkeleton";

// Lazy: the stories viewer drags react-cube-navigation (+ react-spring,
// react-gesture-responder) and react-swipeable; a static import would ship
// them on every page since NavbarClient is mounted in the root layout.
const StoriesContainer = dynamic(() => import("./Stories/NewStories"), {
  ssr: false,
  loading: () => <StoryViewerSkeleton />,
});

function NavbarClient() {
  const { shouldAuthinticated, selectedStory, LoggingOut, isProductPage } =
    useAppStore();
  const { lang } = useParams();

  return (
    <>
      <InitFunction init={lang} />

      <AuthSections />
      {shouldAuthinticated && !LoggingOut && <ConfirmMobilePhoneWidget />}
      {selectedStory?.id && !isProductPage && (
        <StoriesContainer selectedStory={selectedStory} />
      )}
    </>
  );
}

export default NavbarClient;
