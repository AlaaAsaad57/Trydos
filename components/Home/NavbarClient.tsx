"use client";

import InitFunction from "./InitFunction";
import AuthSections from "./AuthSections";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import ConfirmMobilePhoneWidget from "components/Login/ConfirmMobilePhoneWidget";
import StoriesContainer from "./Stories/NewStories";

function NavbarClient() {
  const { shouldAuthinticated, selectedStory } = useAppStore();
  const { lang } = useParams();

  return <></>;
}

export default NavbarClient;
