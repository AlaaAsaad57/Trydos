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
  The skeleton has the screen's shape while its chunk loads. (next/dynamic
  needs its options written out in each call, not in a shared object.)

  A screen that gets a row in appScreenPaths.ts needs an entry here; the
  test of the path table checks it.
*/

export const APP_SCREEN_VIEWS: Partial<
  Record<DemoStaticScreen, React.ComponentType>
> = {
  // Profile (Stage 4). XD artboard names are in each file.
  settings: dynamic(() => import("./screens/ProfileScreen"), {
    loading: () => <ScreenSkeleton kind="tab" />,
  }),
  "settings/photo": dynamic(() => import("./screens/PhotoScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  "settings/client-id": dynamic(() => import("./screens/ClientIdScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  "settings/profile": dynamic(() => import("./screens/ProfileMenuScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  "settings/profile/client-info": dynamic(() => import("./screens/ClientInfoScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  "settings/profile/personal-info": dynamic(() => import("./screens/PersonalInfoScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  "settings/profile/body": dynamic(() => import("./screens/BodyScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  "settings/profile/address": dynamic(() => import("./screens/AddressListScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  "settings/profile/address/new": dynamic(() => import("./screens/AddressFormScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  "settings/preferences": dynamic(() => import("./screens/SettingsScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  // Wallet (Stage 5).
  "settings/wallet": dynamic(() => import("./screens/WalletScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  // Chat (Stage 6).
  chat: dynamic(() => import("./screens/ChatListScreen"), {
    loading: () => <ScreenSkeleton kind="tab" />,
  }),
  "chat/conversation": dynamic(() => import("./screens/ConversationScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  "chat/contact": dynamic(() => import("./screens/ContactScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
  "chat/call": dynamic(() => import("./screens/LiveCallScreen"), {
    loading: () => <ScreenSkeleton />,
  }),
};

export default function AppScreenView({ screen }: { screen: DemoStaticScreen }) {
  const View = APP_SCREEN_VIEWS[screen];
  return View ? <View /> : null;
}
