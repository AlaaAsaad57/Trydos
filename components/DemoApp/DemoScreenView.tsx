"use client";

import React from "react";
import type { DemoScreen } from "./demoRoutes";
import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import EmptyTabScreen from "./screens/EmptyTabScreen";
import ProfileScreen from "./screens/ProfileScreen";
import PhotoScreen from "./screens/PhotoScreen";
import ClientIdScreen from "./screens/ClientIdScreen";
import ProfileMenuScreen from "./screens/ProfileMenuScreen";
import ClientInfoScreen from "./screens/ClientInfoScreen";
import PersonalInfoScreen from "./screens/PersonalInfoScreen";
import BodyScreen from "./screens/BodyScreen";
import AddressListScreen from "./screens/AddressListScreen";
import AddressFormScreen from "./screens/AddressFormScreen";

/** Which component draws which screen. XD artboard names are in each file. */
export default function DemoScreenView({ screen }: { screen: DemoScreen }) {
  switch (screen) {
    case "home":
      return <HomeScreen />;
    case "search":
      return <SearchScreen />;
    case "cart":
      return (
        <EmptyTabScreen
          title="Cart"
          message="Your cart is empty"
          hint="Items you add to your cart will show here"
        />
      );
    case "chat":
      return (
        <EmptyTabScreen
          title="Chat"
          message="No conversations yet"
          hint="Messages with sellers will show here"
        />
      );
    case "settings":
      return <ProfileScreen />;
    case "settings/photo":
      return <PhotoScreen />;
    case "settings/client-id":
      return <ClientIdScreen />;
    case "settings/profile":
      return <ProfileMenuScreen />;
    case "settings/profile/client-info":
      return <ClientInfoScreen />;
    case "settings/profile/personal-info":
      return <PersonalInfoScreen />;
    case "settings/profile/body":
      return <BodyScreen />;
    case "settings/profile/address":
      return <AddressListScreen />;
    case "settings/profile/address/new":
      return <AddressFormScreen />;
  }
}
