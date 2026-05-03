"use client";

import InitFunction from "./InitFunction";
import AuthSections from "./AuthSections";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import ConfirmMobilePhoneWidget from "components/Login/ConfirmMobilePhoneWidget";
import StoriesContainer from "./Stories/NewStories";

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
