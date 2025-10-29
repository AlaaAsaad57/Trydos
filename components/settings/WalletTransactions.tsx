"use client";
import TryDosWalletIcon from "public/svg/TryDosWalletIcon.svg";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import BackIcon from "public/svg/listing/backIcon.svg";
import { useEffect, useState } from "react";
import order from "services/order";

interface WalletTransactionsProps {
  goBack: () => void;
}

function WalletTransactions({ goBack }: WalletTransactionsProps) {
  const { wallet, currency, language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<
    Array<{ id: string; date: string; description: string; amount: number }>
  >([]);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;
  const MAX_PAGES = 3; // simulate total 30 rows
  const getWallet = async () => {
    try {
      setLoading(true);
      const res = await order.GetWallet();
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  useEffect(() => {
    getWallet();
    // initial load
    void loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const simulateApi = (pageIndex: number, limit: number) => {
    return new Promise<
      Array<{ id: string; date: string; description: string; amount: number }>
    >((resolve) => {
      setTimeout(() => {
        const start = (pageIndex - 1) * limit;
        const rows = Array.from({ length: limit }).map((_, i) => {
          const n = start + i + 1;
          const positive = n % 2 === 0;
          const amount = positive
            ? +(5 + (n % 7) * 0.5).toFixed(2)
            : -+(3 + (n % 5) * 0.7).toFixed(2);
          const descriptions = [
            translateFunction("Order Refund"),
            translateFunction("Purchase Payment"),
            translateFunction("Promo Credit"),
            translateFunction("Order Payment"),
          ];
          const description = descriptions[n % descriptions.length];
          const day = String(n % 28 || 1).padStart(2, "0");
          const hour = String(n % 24).padStart(2, "0");
          const min = String((n * 3) % 60).padStart(2, "0");
          return {
            id: `tx-${n}`,
            date: `2025-10-${day} ${hour}:${min}`,
            description,
            amount,
          };
        });
        resolve(rows);
      }, 500);
    });
  };

  const loadMore = async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);
    const nextPage = page;
    const data = await simulateApi(nextPage, PAGE_SIZE);
    setTransactions((prev) => [...prev, ...data]);
    const reached = nextPage >= MAX_PAGES;
    setHasMore(!reached);
    setPage(nextPage + 1);
    setIsFetching(false);
  };

  return (
    <div className="w-full h-full flex-col">
      <div className="bg-[#fff] flex items-center justify-between top-0 left-0 w-full h-[50px] sticky z-10">
        <span
          className="p-2 cursor-pointer"
          onClick={goBack}
          aria-label={translateFunction("Back")}
        >
          <BackIcon />
        </span>
        <h2 className="text-[#1D1D1D] text-[16px] medium">
          {translateFunction("Wallet Transactions")}
        </h2>
        <span />
      </div>

      <div className="w-full px-[12px] pt-[8px] pb-[24px]">
        <div
          className={`${
            isRtl ? "items-end" : ""
          } flex-col w-full bg-[#F8F8F8] rounded-[12px] p-[16px] mb-[16px]`}
          role="region"
          aria-label={translateFunction("Wallet")}
        >
          <div className="flex items-center gap-[12px]">
            <TryDosWalletIcon />
            <div className="flex-col">
              <span className="text-[#1D1D1D] text-[14px] regular">
                {translateFunction("Trydos Wallet")}
              </span>
              <span
                className="text-[#8D8D8D] text-[12px] regular"
                data-cy="user-wallet-amount"
              >
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    {wallet?.wallet_balance?.toFixed(8)} {currency?.symbol}{" "}
                    {translateFunction("Your Balance")}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full bg-white border border-[#EFEFEF] rounded-[12px] overflow-hidden">
          <div
            className={`w-full ${
              isRtl ? "text-right" : "text-left"
            } bg-[#FAFAFA] border-b border-[#EFEFEF]`}
          >
            <div
              className={`grid grid-cols-12 px-4 py-3 text-[12px] text-[#8D8D8D]`}
            >
              <div className="col-span-4">{translateFunction("Date")}</div>
              <div className="col-span-4">
                {translateFunction("Description")}
              </div>
              <div className="col-span-2">{translateFunction("Type")}</div>
              <div
                className={`col-span-2 ${isRtl ? "text-left" : "text-right"}`}
              >
                {translateFunction("Amount")}
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#EFEFEF]">
            {transactions.map((tx) => {
              const isPositive = tx.amount >= 0;
              return (
                <div
                  key={tx.id}
                  className={`grid grid-cols-12 px-4 py-3 items-center ${
                    isRtl ? "text-right" : "text-left"
                  }`}
                >
                  <div className="col-span-4 text-[12px] text-[#6A6A6A]">
                    {tx.date}
                  </div>
                  <div className="col-span-4 text-[13px] text-[#1D1D1D]">
                    {tx.description}
                  </div>
                  <div
                    className={`col-span-2 text-[12px] ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive
                      ? translateFunction("Inflow")
                      : translateFunction("Outflow")}
                  </div>
                  <div
                    className={`col-span-2 text-[13px] font-medium ${
                      isRtl ? "text-left" : "text-right"
                    } ${isPositive ? "text-green-700" : "text-red-600"}`}
                  >
                    {isPositive ? "+" : "-"}
                    {Math.abs(tx.amount).toFixed(2)} {currency?.symbol}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full flex justify-center mt-[12px]">
          {hasMore ? (
            <button
              type="button"
              className="min-w-[160px] h-[40px] px-4 rounded-[10px] bg-[#f8f8f8] text-[#1d1d1d] text-[14px] medium disabled:opacity-60"
              onClick={loadMore}
              disabled={isFetching}
              aria-busy={isFetching}
            >
              {isFetching
                ? translateFunction("Loading...")
                : translateFunction("Load More")}
            </button>
          ) : (
            <span className="text-[12px] text-[#8D8D8D]">
              {translateFunction("No more orders")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletTransactions;
