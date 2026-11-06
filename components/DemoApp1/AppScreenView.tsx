"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { DemoStaticScreen } from "../DemoApp/demoRoutes";
import ScreenSkeleton from "./ScreenSkeleton";

/*
  Which component draws which screen in the real app (the screen mount,
  AppScreens). The /demo preview keeps Demo1ScreenView, which loads every
  screen at once.

  Here each screen is its own chunk (next/dynamic), because the mount sits in
  the [lang] layout: a static import would put every new screen in the code
  of every page, old pages too. A page now loads only the screen it shows.
  Each screen has its own skeleton while its chunk loads. (next/dynamic
  needs its options written out in each call, not in a shared object.)

  A screen that gets a row in appScreenPaths.ts needs an entry here; the
  test of the path table checks it.
*/

export const APP_SCREEN_VIEWS: Partial<
  Record<DemoStaticScreen, React.ComponentType>
> = {
  // Profile (Stage 4). XD artboard names are in each file.
  settings: dynamic(() => import("./screens/ProfileScreen"), {
    loading: () => <ScreenSkeleton screen="settings" />,
  }),
  "settings/photo": dynamic(() => import("./screens/PhotoScreen"), {
    loading: () => <ScreenSkeleton screen="settings/photo" />,
  }),
  "settings/client-id": dynamic(() => import("./screens/ClientIdScreen"), {
    loading: () => <ScreenSkeleton screen="settings/client-id" />,
  }),
  "settings/profile": dynamic(() => import("./screens/ProfileMenuScreen"), {
    loading: () => <ScreenSkeleton screen="settings/profile" />,
  }),
  "settings/profile/client-info": dynamic(() => import("./screens/ClientInfoScreen"), {
    loading: () => <ScreenSkeleton screen="settings/profile/client-info" />,
  }),
  "settings/profile/personal-info": dynamic(() => import("./screens/PersonalInfoScreen"), {
    loading: () => <ScreenSkeleton screen="settings/profile/personal-info" />,
  }),
  "settings/profile/body": dynamic(() => import("./screens/BodyScreen"), {
    loading: () => <ScreenSkeleton screen="settings/profile/body" />,
  }),
  "settings/profile/address": dynamic(() => import("./screens/AddressListScreen"), {
    loading: () => <ScreenSkeleton screen="settings/profile/address" />,
  }),
  "settings/profile/address/new": dynamic(() => import("./screens/AddressFormScreen"), {
    loading: () => <ScreenSkeleton screen="settings/profile/address/new" />,
  }),
  "settings/preferences": dynamic(() => import("./screens/SettingsScreen"), {
    loading: () => <ScreenSkeleton screen="settings/preferences" />,
  }),
  // Wallet (Stage 5).
  "settings/wallet": dynamic(() => import("./screens/WalletScreen"), {
    loading: () => <ScreenSkeleton screen="settings/wallet" />,
  }),
  // Chat (Stage 6).
  chat: dynamic(() => import("./screens/ChatListScreen"), {
    loading: () => <ScreenSkeleton screen="chat" />,
  }),
  "chat/conversation": dynamic(() => import("./screens/ConversationScreen"), {
    loading: () => <ScreenSkeleton screen="chat/conversation" />,
  }),
  "chat/contact": dynamic(() => import("./screens/ContactScreen"), {
    loading: () => <ScreenSkeleton screen="chat/contact" />,
  }),
  "chat/call": dynamic(() => import("./screens/LiveCallScreen"), {
    loading: () => <ScreenSkeleton screen="chat/call" />,
  }),
};

export default function AppScreenView({ screen }: { screen: DemoStaticScreen }) {
  const View = APP_SCREEN_VIEWS[screen];
  return View ? <View /> : null;
}
