import BackBar from "components/setting/BackBar";
import WalletTransactions from "components/settings/WalletTransactions";
import React from "react";

async function Wallet({ params, searchParams }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  const local = Params.lang;

  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen"
      key="wallet-setting-page"
    >
      <BackBar
        isRtl={isRtl}
        local={local}
        name={"Wallet Transactions"}
        preivous_page={`/${local}/settings`}
      />
      <WalletTransactions isRtl={isRtl} local={local} />
    </div>
  );
}

export default Wallet;
