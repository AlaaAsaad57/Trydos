"use client";

import BottomSheet from "components/global/BottomSheet";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { RDB } from "rdb";
import { serverActions } from "services/RDB";
import Spinner from "components/global/Spinner";
import order from "services/order";
import "rdb/styles";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
function WalletLinkCard({ isRtl, language, country }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWallet] = useState(null);
  const [walletToken, setWalletToken] = useState<string | null>(null);
  const [walletError, setWalletError] = useState(false);
  const [walletErrorMessage, setWalletErrorMessage] = useState<string | null>(
    null,
  );
  const { setShouldAuthinticated, shouldAuthinticated, user, setLoginOpen } =
    useAppStore();
  const GetWalletForUser = async () => {
    setLoading(true);
    setWalletError(false);
    setWalletErrorMessage(null);
    try {
      const balance = await order.GetWalletBalanceToShow({
        country: country,
      });

      if (!balance || (balance as any)?.success === false) {
        setWalletError(true);
        const messageFromResponse =
          (balance as any)?.message || (balance as any)?.error;
        setWalletErrorMessage(
          messageFromResponse ||
            translateFunction("Failed to load wallet balance", language),
        );
      }

      setWallet(balance);
    } catch (error: any) {
      setWalletError(true);
      const messageFromError = error?.message;
      setWalletErrorMessage(
        messageFromError ||
          translateFunction("Failed to load wallet balance", language),
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!shouldAuthinticated) {
      GetWalletForUser();
    }
  }, [shouldAuthinticated]);
  useEffect(() => {
    if (open) {
      fetch("/api/auth/wallet-token", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.token && setWalletToken(d.token))
        .catch(() => {});
    }
  }, [open]);
  return (
    <div
      onClick={() => {
        if (user && user?.phone?.length > 3) setOpen(true);
        else setLoginOpen(true);
      }}
      className={`${(!user || user?.phone === "0") && "opacity-65"} ${
        isRtl && "items-end"
      } flex-col w-1/2 h-[94px] bg-[#F8F8F8] rounded-[12px] p-[12px]  cursor-pointer`}
      aria-label={translateFunction("Wallet Transactions", language)}
    >
      {open &&
        !shouldAuthinticated &&
        createPortal(
          <BottomSheet
            isOpen={open}
            onClose={() => {
              setOpen(false);
            }}
            noScroll={true}
            height={80}
          >
            {/* // @ts-ignore */}
            <RDB
              onClose={() => {
                setOpen(false);
              }}
              actions={serverActions}
              storeKey="trydos"
              handleUnauthenticated={() => {
                setShouldAuthinticated(true);
              }}
              onReceivedAuthToken={() => {}}
              cookiesKeys={{
                authToken: COOKIE_NAMES.WALLET_TOKEN,
                local: COOKIE_NAMES.LOCAL,
              }}
            />
            {/* <TestNewWalletIntegrations
              handleUnauthenticatedFromParent={() => {}}
              local="gb-en"
            /> */}
          </BottomSheet>,
          document.body,
        )}
      <img className="w-[25px] h-[25px]" src="/icons/TryDosWalletIcon.svg" />
      <span className="text-[#1D1D1D] text-[14px] regular mt-[4px]">
        {translateFunction("RDB Wallet", language)}
      </span>
      <span
        className="text-[#8D8D8D] text-[12px] regular"
        data-cy="user-wallet-amount"
      >
        <span className="medium">
          {loading ? (
            <Spinner />
          ) : walletError ? (
            "--"
          ) : (
            walletBalance?.totalAvailable?.toFixed(
              walletBalance?.decimal_digits,
            )
          )}{" "}
        </span>
        {walletBalance?.symbol} {translateFunction("Your Balance", language)}
        {walletError && !loading && (
          <span className="relative ml-2 inline-flex group">
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-red-300 px-2 py-0.5 text-[11px] text-red-500 hover:bg-red-50 focus:outline-hidden focus:ring-2 focus:ring-red-400"
              aria-label={translateFunction(
                "Retry fetching wallet balance",
                language,
              )}
              onClick={(event) => {
                event.stopPropagation();
                GetWalletForUser();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  GetWalletForUser();
                }
              }}
            >
              <svg
                className="mr-1 h-[15px] w-[15px]"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4.5 4.5C6.84315 2.15685 10.3431 2.15685 12.6863 4.5C13.8579 5.67157 14.5 7.25736 14.5 8.84315M14.5 3.5V8.5H9.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.5 15.5C13.1569 17.8431 9.65685 17.8431 7.31371 15.5C6.14214 14.3284 5.5 12.7426 5.5 11.1569M5.5 16.5V11.5H10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {translateFunction("Retry", language)}
            </button>
            {walletErrorMessage && (
              <span
                className="pointer-events-none absolute -top-2 left-1/2 z-10 w-max -translate-x-1/2 -translate-y-full rounded-md bg-black/80 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                role="status"
              >
                {walletErrorMessage}
              </span>
            )}
          </span>
        )}
      </span>
    </div>
  );
}

export default WalletLinkCard;
