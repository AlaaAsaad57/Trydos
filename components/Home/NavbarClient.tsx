"use client";

import React, { Suspense } from "react";
import InitFunction from "./InitFunction";
import AuthSections from "./AuthSections";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import ConfirmMobilePhoneWidget from "components/Login/ConfirmMobilePhoneWidget";
import StoriesContainer from "./Stories/NewStories";

function NavbarClient() {
  const { shouldAuthinticated, selectedStory } = useAppStore();
  const { lang } = useParams();

  return (
    <>
      <Suspense fallback={<></>}>
        <InitFunction init={lang} />
      </Suspense>
      <AuthSections />
      {shouldAuthinticated && <ConfirmMobilePhoneWidget />}
      {selectedStory?.id && <StoriesContainer selectedStory={selectedStory} />}
    </>
  );
}

export default NavbarClient;
