"use client";
import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import LandingPage from "./LandingPage";
import { useSelector } from "react-redux";
const ChatModal = dynamic(() => import("components/Chat/ChatModal"), {
  loading: () => <LandingPage />,
});
const NewLoginWidget = dynamic(
  () => import("components/Login/NewLoginWidget"),
  {
    loading: () => <LandingPage />,
  }
);
function AuthSections() {
  const chatOpen = useSelector((state: any) => state.chat.chatVar);
  const loginOpen = useSelector((state: any) => state.homepage.loginOpen);
  return (
    <>
      {chatOpen && <ChatModal />}
      {loginOpen && <NewLoginWidget />}
    </>
  );
}

export default AuthSections;
