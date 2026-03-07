"use client";
import { useAppStore } from "store";
import { LogError, translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import { useEffect, useState } from "react";
import order from "services/order";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  date: string;
  description: string;
  order_id?: number;
  amount: number;
}

function WalletTransactions({ isRtl, local }) {
  const { currency, setOrderDetails } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [loadingNavigation, setLoadingNavigation] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [offset, setOffset] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState<string | undefined>(
    currency?.symbol,
  );
  const PAGE_SIZE = 10;
  const GoToOrders = async (order_id) => {
    try {
      if (loadingNavigation) return;
      setLoadingNavigation(true);
      let respons = await fetchData({
        method: "GET",
        url: `/customer/order/details?order_id=${order_id}`,
        server: "market",
        reqTitle: REQUESTS_DATA.GET_ORDER_DETAILS,
      });

      if (respons) {
        router.push(
          `/${local}/settings/orders/${respons.data.order_group_id}?order_id=${order_id}&is_from_wallet=true`,
        );
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In GoToOrders in WalletTransactions",
      });
      setLoadingNavigation(false);
      // setLoadingNavigation(false);
    }
  };
  const getWallet = async () => {
    try {
      setLoading(true);
      const res = await order.GetWallet();
      if (res) {
        setWalletBalance(res.wallet_balance || 0);
        setCurrencySymbol(res.currency_symbol || currency?.symbol);
      }
      setLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In getWallet in WalletTransations",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    getWallet();
    void loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString.replace(" ", "T"));
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
      return dateString;
    }
  };

  const loadMore = async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);
    try {
      const currentOffset = offset;
      const response = await order.GetWalletTransactions(
        PAGE_SIZE,
        currentOffset,
      );
      if (response) {
        const newTransactions: Transaction[] =
          response.wallet_transaction_list?.map((tx: any) => {
            const amount = tx.credit > 0 ? tx.credit : -tx.debit;
            return {
              id: tx.id,
              order_id: tx?.order_id,
              date: formatDate(tx.created_at),
              description:
                tx.transaction_type?.name || tx.reference || "Transaction",
              amount,
            };
          }) || [];

        setTransactions((prev) => {
          const updated = [...prev, ...newTransactions];
          if (newTransactions.length === 0) {
            setHasMore(false);
          } else setHasMore(true);
          return updated;
        });

        setTotalTransactions(response.total_wallet_transaction || 0);
        setWalletBalance(response.wallet_balance || walletBalance);
        setOffset(currentOffset + 1);
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In loadMore in walletTransations",
      });
      setHasMore(false);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div
      className={`${
        loadingNavigation && "opacity-65 scale-95"
      } w-full h-full flex-col`}
    >
      <div className="w-full px-[12px] pt-[8px] pb-[24px]">
        <div
          className={`${
            isRtl ? "items-end" : ""
          } flex-col w-full bg-[#F8F8F8] rounded-[12px] p-[16px] mb-[16px]`}
          role="region"
          aria-label={translateFunction("Wallet")}
        >
          <div className="flex items-center gap-[12px]">
            <img src="/icons/WalletIcon.svg" />
            <div className="flex-col">
              <span className="text-[#1D1D1D] text-[14px] regular">
                {translateFunction("RDB Wallet")}
              </span>
              <span
                className="text-[#8D8D8D] text-[12px] regular"
                data-cy="user-wallet-amount"
              >
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    {walletBalance.toFixed(currency?.decimal_digits)}{" "}
                    {currencySymbol} {translateFunction("Your Balance")}
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
                  <div
                    onClick={() => {
                      if (tx?.order_id) {
                        GoToOrders(tx?.order_id);
                      }
                    }}
                    className={`${
                      tx?.order_id
                        ? "underline-offset-1 underline cursor-pointer text-[#3195ff]"
                        : ""
                    } col-span-4 text-[13px] text-[#1D1D1D]`}
                  >
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
                    {Math.abs(tx.amount).toFixed(currency?.decimal_digits)}{" "}
                    {currencySymbol}
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
