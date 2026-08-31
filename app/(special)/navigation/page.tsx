import React from "react";
import NavigationDemo from "components/NavigationDemo/NavigationDemo";
import "styles/globals.css"
// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const metadata = {
  title: "Bottom Navigation Demo | Trydos",
  description: "Design demo for the iOS-style glass bottom navigation bar.",
};

export default function NavigationDemoPage() {
  return <NavigationDemo />;
}
