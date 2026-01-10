import NextLink from "components/global/NextLink";
import { getCurrency } from "serverRequests";
import { getWallet } from "serverRequests/settings";
import { translateFunction } from "utils/server";

async function WalletLinkCard({ isRtl, local, language, country }) {
  let [currency, wallet] = await Promise.all([
    getCurrency(country, language),
    getWallet({ language, country, limit: 1, offset: 1 }),
  ]);

  return (
    <NextLink
      href={`/${local}/settings/wallet`}
      className={` ${
        isRtl && "items-end"
      } flex-col w-1/2 h-[94px] bg-[#F8F8F8] rounded-[12px] p-[12px]  cursor-pointer`}
      aria-label={translateFunction("Wallet Transactions", language)}
    >
      <img className="w-[25px] h-[25px]" src="/svg/TryDosWalletIcon.svg" />
      <span className="text-[#1D1D1D] text-[14px] regular mt-[4px]">
        {translateFunction("Trydos Wallet", language)}
      </span>
      <span
        className="text-[#8D8D8D] text-[12px] regular"
        data-cy="user-wallet-amount"
      >
        <span className="medium">
          {wallet?.wallet_balance?.toFixed(currency?.decimal_digits)}{" "}
        </span>
        {currency?.symbol} {translateFunction("Your Balance", language)}
      </span>
    </NextLink>
  );
}

export default WalletLinkCard;
