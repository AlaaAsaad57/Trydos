"use client";

import BottomSheet from "components/global/BottomSheet";
import React, { useState, useEffect } from "react";
import {
  GetBanks,
  GetWalletBalance,
  GetBankDepostits,
  CalculateFees,
  getCurrencies,
  UploadMedia,
  CreateBankDeposit,
  CheckoutOrder,
  GetWalletBalanceForCountryCurrency,
} from "services/wallet";
import { createPortal } from "react-dom";
import { translateFunction } from "utils/functions";
import {
  BanksApi,
  CalculateFeesApi,
  CurrenciesApi,
  GetBankDepositeApi,
  GetWalletBalancesApi,
} from "services/wallet/types";
import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";
import { RDB } from "ramaaz-digital-banking";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";
import { serverActions } from "services/RDB";
import Spinner from "components/global/Spinner";
import order from "services/order";

function WalletLinkCard({ isRtl, language, wallet, currency, country, local }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWallet] = useState(null);
  const { setShouldAuthinticated, shouldAuthinticated, user, setLoginOpen } =
    useAppStore();
  const GetWalletForUser = async () => {
    setLoading(true);
    let balance = await order.GetWalletBalanceToShow({ country: country });
    setWallet(balance);
    setLoading(false);
  };
  useEffect(() => {
    if (!shouldAuthinticated) {
      GetWalletForUser();
    }
  }, [shouldAuthinticated]);
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
              baseUrl={process.env.NEXT_PUBLIC_WALLET_BACKEND_URL}
              storeKey="trydos"
              authToken={getCookie(COOKIE_NAMES.WALLET_TOKEN)}
              handleUnauthenticated={() => {
                setShouldAuthinticated(true);
              }}
              onReceivedAuthToken={() => {}}
              local={(local as string) ?? "gb-en"}
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
        {translateFunction("Trydos Wallet", language)}
      </span>
      <span
        className="text-[#8D8D8D] text-[12px] regular"
        data-cy="user-wallet-amount"
      >
        <span className="medium">
          {loading ? (
            <Spinner />
          ) : (
            walletBalance?.totalAvailable?.toFixed(
              walletBalance?.decimal_digits,
            )
          )}{" "}
        </span>
        {walletBalance?.symbol} {translateFunction("Your Balance", language)}
      </span>
    </div>
  );
}

export default WalletLinkCard;

function TestNewWalletIntegrations({
  local = "gb-en",
  handleUnauthenticatedFromParent,
}) {
  const [loading, setLoading] = useState(false);
  // --- Global Data State ---
  const [currencies, setCurrencies] = useState<CurrenciesApi["items"]>([]);
  const [banks, setBanks] = useState<BanksApi["items"]>([]);

  // --- User Specific Data State ---
  const [walletData, setWalletData] = useState<GetWalletBalancesApi | null>(
    null,
  );
  const [history, setHistory] = useState<GetBankDepositeApi["items"]>([]);

  // --- UI Selection State ---
  const [activeCurrency, setActiveCurrency] = useState<
    CurrenciesApi["items"][0] | null
  >(null);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // --- Form State ---
  const [selectedBankId, setSelectedBankId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [feeDetails, setFeeDetails] = useState<CalculateFeesApi | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const handleUnauthenticated = () => {
    handleUnauthenticatedFromParent();
  };
  // ---------------------------------------------------------
  // 1. PHASE ONE: Load Global Config (Currencies & Banks)
  // ---------------------------------------------------------
  useEffect(() => {
    const loadGlobalConfig = async () => {
      setLoading(true);
      try {
        const [currRes, bankRes] = await Promise.all([
          getCurrencies({ local, handleUnauthenticated }),
          GetBanks({ local, handleUnauthenticated }),
        ]);

        if (bankRes?.items) setBanks(bankRes.items);

        if (currRes?.items && currRes.items.length > 0) {
          setCurrencies(currRes.items);
          // AUTO-SELECT DEFAULT: Select the first currency immediately
          setActiveCurrency(currRes.items[0]);
        }
      } catch (error) {
        console.error("Failed to load global config", error);
      }
      setLoading(false);
    };

    loadGlobalConfig();
  }, [local]);

  // ---------------------------------------------------------
  // 2. PHASE TWO: Load Wallet Data Dependent on Active Currency
  // ---------------------------------------------------------
  useEffect(() => {
    // Only fetch if we have an active currency selected
    if (!activeCurrency) return;

    const loadUserData = async () => {
      setIsLoadingBalance(true);
      try {
        // Fetch Balance SPECIFIC to the active currency symbol
        const [balRes, histRes] = await Promise.all([
          GetWalletBalance({
            currencySymbol: activeCurrency.symbol,
            local,
            handleUnauthenticated,
          }),
          GetBankDepostits({ local, handleUnauthenticated }), // History might still need client-side filtering or param update
        ]);

        if (balRes) setWalletData(balRes);
        if (histRes?.items) setHistory(histRes.items);
      } catch (error) {
        console.error("Failed to load user wallet data", error);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    loadUserData();
  }, [activeCurrency, local]);

  // ---------------------------------------------------------
  // Helpers & Handlers
  // ---------------------------------------------------------

  // Helper: Get Balance for Active Currency (Safely handles loading state)
  const activeBalance = React.useMemo(() => {
    if (!walletData || !activeCurrency) return 0;

    // Attempt to find the balance for the requested symbol
    const wallet = walletData.wallets?.[0];
    const balanceEntry = wallet?.balances?.find(
      (b) =>
        b.assetSymbol === activeCurrency.symbol ||
        b.assetId === activeCurrency.id,
    );

    return balanceEntry?.available || 0;
  }, [walletData, activeCurrency]);

  // Helper: Filter History for Active Currency
  const filteredHistory = React.useMemo(() => {
    if (!activeCurrency) return history;
    return history.filter((h) => h.currency?.symbol === activeCurrency.symbol);
  }, [history, activeCurrency]);

  const handleAmountChange = async (val: number) => {
    setAmount(val);
    if (val > 0 && selectedBankId && activeCurrency) {
      const res = await CalculateFees({
        amount: val,
        bankId: selectedBankId,
        currencyId: activeCurrency.id,
        local,
        handleUnauthenticated,
      });
      if (res) setFeeDetails(res);
    } else {
      setFeeDetails(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsUploading(true);
    try {
      const res = await UploadMedia({
        file: e.target.files[0],
        local,
        handleUnauthenticated,
      });
      if (res?.url) setImageUrl(res.url);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitDeposit = async () => {
    if (!activeCurrency || !selectedBankId || !amount || !imageUrl) return;

    setIsSubmitting(true);
    try {
      await CreateBankDeposit({
        bankId: selectedBankId,
        currencyId: activeCurrency.id,
        amount: amount,
        transferImageUrl: imageUrl,
        transactionReference: `REF-${Date.now()}`,
        idempotencyKey: crypto.randomUUID(),
        local,
        handleUnauthenticated,
      });

      // Refresh History specifically
      const newHistory = await GetBankDepostits({
        local,
        handleUnauthenticated,
      });
      if (newHistory?.items) setHistory(newHistory.items);

      setShowDepositForm(false);
      setAmount(0);
      setImageUrl("");
      setFeeDetails(null);
      alert("Deposit Requested Successfully!");
    } catch (error) {
      console.error("Deposit failed", error);
      alert("Failed to submit deposit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Wallet</h1>
        <p className="text-gray-500">Manage your balances and transactions</p>
      </header>

      {/* --- SECTION 1: CURRENCY CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading && <LoadingCurrnecies />}
        {currencies.map((currency) => {
          const isSelected = activeCurrency?.id === currency.id;

          // NOTE: Since we only fetch balance for the ACTIVE symbol now,
          // inactive cards might show 0 or loading state if data isn't present.
          // We check if we have data for this specific card in the current walletData payload.
          const balance =
            walletData?.wallets?.[0]?.balances?.find(
              (b) => b.assetId === currency.id,
            )?.available || 0;

          return (
            <button
              key={currency.id}
              onClick={() => {
                setActiveCurrency(currency);
                setShowDepositForm(false);
                setAmount(0);
                setFeeDetails(null);
              }}
              className={`
                relative p-5 rounded-xl border text-left transition-all duration-200 shadow-xs
                ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 shadow-lg scale-[1.02]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md"
                }
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-sm font-bold px-2 py-1 rounded-md ${isSelected ? "bg-blue-500/30" : "bg-gray-100"}`}
                >
                  {currency.symbol}
                </span>
              </div>
              <div>
                <p
                  className={`text-xs ${isSelected ? "text-blue-100" : "text-gray-500"}`}
                >
                  Available Balance
                </p>
                <h3 className="text-2xl font-bold tracking-tight">
                  {/* Show spinner or dash if we are switching contexts and loading new data */}
                  {isSelected && isLoadingBalance ? (
                    <span className="text-lg animate-pulse">Loading...</span>
                  ) : (
                    <>
                      {balance.toLocaleString()}{" "}
                      <span className="text-lg font-medium">
                        {currency.symbol}
                      </span>
                    </>
                  )}
                </h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* --- SECTION 2: ACTIVE CURRENCY ACTION AREA --- */}
      {activeCurrency && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* LEFT COLUMN: ACTIONS & FORM */}
          <div className="lg:col-span-1 space-y-6">
            {loading && <Skeleton width={292} height={107} />}
            {!showDepositForm ? (
              <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 text-center">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Actions for {activeCurrency.displayName}
                </h3>
                <button
                  onClick={() => setShowDepositForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    ></path>
                  </svg>
                  Add Funds (Deposit)
                </button>
              </div>
            ) : (
              /* DEPOSIT FORM */
              <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 relative">
                <button
                  onClick={() => setShowDepositForm(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
                <h3 className="text-lg font-bold mb-1 text-gray-800">
                  Deposit {activeCurrency.symbol}
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  Complete the form to request a deposit.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Source Bank
                    </label>
                    <select
                      className="w-full text-black border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      value={selectedBankId}
                    >
                      <option value="" className="text-black">
                        Select a bank...
                      </option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full text-black border border-gray-300 rounded-lg p-2.5 pl-4 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                        placeholder="0.00"
                        onChange={(e) =>
                          handleAmountChange(Number(e.target.value))
                        }
                      />
                      <span className="absolute right-4 top-2.5 text-gray-400 text-sm">
                        {activeCurrency.symbol}
                      </span>
                    </div>
                  </div>

                  {feeDetails && (
                    <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-2 border border-blue-100">
                      <div className="flex justify-between text-gray-600">
                        <span>Fee:</span>
                        <span>
                          {feeDetails.feeAmount} {activeCurrency.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between text-blue-800 font-bold pt-2 border-t border-blue-100">
                        <span>You Receive:</span>
                        <span>
                          {feeDetails.netAmount} {activeCurrency.symbol}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Proof of Transfer
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition cursor-pointer relative">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-gray-500">
                        {isUploading ? (
                          <span className="text-blue-600 font-medium">
                            Uploading...
                          </span>
                        ) : imageUrl ? (
                          <span className="text-green-600 font-medium flex items-center justify-center gap-1">
                            ✓ Receipt Attached
                          </span>
                        ) : (
                          <span className="text-xs">Click to upload image</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitDeposit}
                    disabled={
                      isSubmitting || !imageUrl || !amount || !selectedBankId
                    }
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-xs transition-all mt-2"
                  >
                    {isSubmitting ? "Processing..." : "Confirm Deposit"}
                  </button>
                </div>
              </div>
            )}
            <CheckoutSection
              activeCurrency={activeCurrency}
              availableBalance={activeBalance}
              local={local}
              handleUnauthenticated={handleUnauthenticated}
              onSuccess={() => {
                // Trigger a balance refresh by re-fetching wallet data
                setActiveCurrency({ ...activeCurrency });
              }}
            />
          </div>

          {/* RIGHT COLUMN: HISTORY TABLE */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">
                  Transaction History ({activeCurrency.symbol})
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-sm">
                  {filteredHistory.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Bank</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                            <div className="text-xs text-gray-400 font-mono mt-0.5">
                              {item.transactionReference}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium">
                            {item.bank?.name || "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-800">
                            {item.amount.toLocaleString()}{" "}
                            <span className="text-xs font-normal text-gray-500">
                              {item.currency.symbol}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-gray-400"
                        >
                          No transactions found for {activeCurrency.symbol}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const LoadingCurrnecies = () => {
  return (
    <>
      {Array.from({ length: 5 }).map((_m) => (
        <Skeleton
          width={222}
          height={98}
          className={`
                relative  p-5 rounded-xl border text-left transition-all duration-200 shadow-xs
               
              `}
        />
      ))}
    </>
  );
};
function StatusBadge({ status }: { status: string }) {
  const styles = {
    APPROVED: "bg-green-100 text-green-700 border-green-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
    PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  // @ts-ignore
  const activeStyle = styles[status] || "bg-gray-100 text-gray-700";

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-bold border ${activeStyle}`}
    >
      {status}
    </span>
  );
}

interface CheckoutProps {
  activeCurrency: { id: string; symbol: string; displayName: string };
  availableBalance: number;
  local: string;
  handleUnauthenticated: () => void;
  onSuccess: () => void;
}

export function CheckoutSection({
  activeCurrency,
  availableBalance,
  local,
  handleUnauthenticated,
  onSuccess,
}: CheckoutProps) {
  const [cartId, setCartId] = useState("");
  const [checkoutAmount, setCheckoutAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!cartId || checkoutAmount <= 0) {
      alert("Please enter a valid Cart ID and Amount");
      return;
    }

    if (checkoutAmount > availableBalance) {
      alert("Insufficient balance in your wallet.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await CheckoutOrder({
        cartId,
        amount: checkoutAmount,
        currencyId: activeCurrency.id,
        idempotencyKey: crypto.randomUUID(),
        local,
        handleUnauthenticated,
      });

      if (result) {
        alert("Payment successful!");
        setCartId("");
        setCheckoutAmount(0);
        onSuccess(); // Refresh balance in parent
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 relative mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800">Quick Checkout</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Cart ID
          </label>
          <input
            type="text"
            value={cartId}
            onChange={(e) => setCartId(e.target.value)}
            className="w-full text-black border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-hidden"
            placeholder="e.g. CART-12345"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Amount to Pay
          </label>
          <div className="relative">
            <input
              type="number"
              value={checkoutAmount || ""}
              onChange={(e) => setCheckoutAmount(Number(e.target.value))}
              className="w-full text-black border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-hidden"
              placeholder="0.00"
            />
            <span className="absolute right-4 top-2.5 text-gray-400 text-sm">
              {activeCurrency.symbol}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-gray-500">
            Wallet Balance: {availableBalance.toLocaleString()}{" "}
            {activeCurrency.symbol}
          </p>
        </div>

        <button
          onClick={handleCheckout}
          disabled={isProcessing || !cartId || checkoutAmount <= 0}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-bold transition-all shadow-xs"
        >
          {isProcessing ? "Processing Payment..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
