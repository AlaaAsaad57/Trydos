import { lang as langParam } from "next/root-params";
import BackBar from "components/setting/BackBar";
import WalletTransactions from "components/settings/WalletTransactions";
import { translateFunction } from "utils/server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

async function Wallet({ searchParams }) {
  const lang = await langParam();
  let [country, language] = lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  const local = lang;

  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen"
      key="wallet-setting-page"
    >
      <BackBar
        isRtl={isRtl}
        local={local}
        name={translateFunction("Wallet Transactions", language)}
        preivous_page={`/${local}/settings`}
      />
      <WalletTransactions isRtl={isRtl} local={local} />
    </div>
  );
}

export default Wallet;
