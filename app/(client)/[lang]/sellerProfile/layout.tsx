import React from "react";
import { redirect } from "next/navigation";
import { SellerProfileProvider } from "./SellerProfileContext";
import { getSellerShopsCached } from "serverRequests/settings/sellerShopsGuard";

async function layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Server-side guard: a user with no shops/permissions must never reach the
  // seller dashboard (this layout wraps every /sellerProfile route). Only bounce
  // when the backend conclusively confirms zero shops — inconclusive failures
  // (transient 5xx / network) fall through so a legitimate seller is never
  // kicked out on an infra hiccup; the client page still enforces its own state.
  const { hasShops, conclusive } = await getSellerShopsCached(lang);
  if (conclusive && !hasShops) {
    redirect(`/${lang}`);
  }

  return (
    <div className="w-full overflow-auto flex flex-col max-w-[1366px] min-h-screen bg-[#fafafa] p-4 lg:p-6 text-[#3c3c3c]">
      <SellerProfileProvider>{children}</SellerProfileProvider>
    </div>
  );
}

export default layout;
