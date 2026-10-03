import React from "react";
import { describe, expect, it, vi } from "vitest";
import { navigationSpies } from "../../mocks/nextNavigation";

vi.mock("next/root-params", () => ({ lang: async () => "sy-en" }));

import DemoLayout from "app/(client)/[lang]/demo/layout";
import Home from "app/(client)/[lang]/demo/page";
import Settings from "app/(client)/[lang]/demo/settings/page";
import ClientId from "app/(client)/[lang]/demo/settings/client-id/page";
import Photo from "app/(client)/[lang]/demo/settings/photo/page";
import Profile from "app/(client)/[lang]/demo/settings/profile/page";
import Address from "app/(client)/[lang]/demo/settings/profile/address/page";
import AddressNew from "app/(client)/[lang]/demo/settings/profile/address/new/page";
import Body from "app/(client)/[lang]/demo/settings/profile/body/page";
import ClientInfo from "app/(client)/[lang]/demo/settings/profile/client-info/page";
import PersonalInfo from "app/(client)/[lang]/demo/settings/profile/personal-info/page";
import Wallet from "app/(client)/[lang]/demo/settings/wallet/page";

type Search = Record<string, string | string[] | undefined>;
type DemoPage = (props: { searchParams: Promise<Search> }) => unknown;

/** Opens one /demo page and returns where it sent the browser. */
const sentTo = async (page: DemoPage, search: Search = {}) => {
  try {
    await page({ searchParams: Promise.resolve(search) });
  } catch {
    // The stand-in redirect() throws, as the real one does.
  }
  expect(
    navigationSpies.redirect,
    "the /demo page did not redirect at all",
  ).toHaveBeenCalledTimes(1);
  return navigationSpies.redirect.mock.calls[0][0];
};

describe("/demo is off: every page goes to the same screen on /demo1", () => {
  it.each([
    ["/demo", Home, "/sy-en/demo1"],
    ["/demo/settings", Settings, "/sy-en/demo1/settings"],
    ["/demo/settings/client-id", ClientId, "/sy-en/demo1/settings/client-id"],
    ["/demo/settings/photo", Photo, "/sy-en/demo1/settings/photo"],
    ["/demo/settings/profile", Profile, "/sy-en/demo1/settings/profile"],
    [
      "/demo/settings/profile/address",
      Address,
      "/sy-en/demo1/settings/profile/address",
    ],
    [
      "/demo/settings/profile/address/new",
      AddressNew,
      "/sy-en/demo1/settings/profile/address/new",
    ],
    [
      "/demo/settings/profile/body",
      Body,
      "/sy-en/demo1/settings/profile/body",
    ],
    [
      "/demo/settings/profile/client-info",
      ClientInfo,
      "/sy-en/demo1/settings/profile/client-info",
    ],
    [
      "/demo/settings/profile/personal-info",
      PersonalInfo,
      "/sy-en/demo1/settings/profile/personal-info",
    ],
    ["/demo/settings/wallet", Wallet, "/sy-en/demo1/settings/wallet"],
  ])("%s goes to its /demo1 screen", async (_, page, target) => {
    expect(await sentTo(page as unknown as DemoPage)).toBe(target);
  });

  it("the search, cart and chat tabs keep their query, written as /demo1 writes it", async () => {
    expect(await sentTo(Home as unknown as DemoPage, { search: "" })).toBe(
      "/sy-en/demo1?search",
    );
  });

  it("a query with a value keeps the value", async () => {
    expect(
      await sentTo(Settings as unknown as DemoPage, { tab: "a b" }),
    ).toBe("/sy-en/demo1/settings?tab=a%20b");
  });

  it("the layout draws no demo shell, so the page under it runs and redirects", async () => {
    const page = <p>the page</p>;
    const tree = (await DemoLayout({ children: page })) as React.ReactElement<{
      children: React.ReactNode;
    }>;
    expect(
      tree === page || tree.props.children === page,
      "the /demo layout still wraps the page in its shell, which draws the screen itself and never runs the page's redirect",
    ).toBe(true);
  });
});
