"use client";

import { createPortal } from "react-dom";
import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "store";
import {
  CheckoutOrder,
  GetWalletBalance,
  getCurrencies,
} from "services/wallet";
import { CurrenciesApi, GetWalletBalancesApi } from "services/wallet/types";
import { RoundPrice } from "utils/functions";

export default function CheckoutButton({ local = "gb-en" }) {
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currencies, setCurrencies] = useState<CurrenciesApi["items"]>([]);
  const [walletData, setWalletData] = useState<GetWalletBalancesApi | null>(
    null,
  );
  const [selectedCurrency, setSelectedCurrency] = useState<
    CurrenciesApi["items"][0] | null
  >(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    cart,
    total,
    currency,
    user,
    enableCart,
    setShouldAuthinticated,
    cartShippingSuccess,
    cart_loading,
  } = useAppStore();

  // Client-side mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if button should be visible
  const shouldShowButton = useMemo(() => {
    if (
      !user ||
      !user.phone ||
      user.phone === "0" ||
      user.phone.length <= 3 ||
      cart_loading
    ) {
      return false;
    }
    return cart && cart.length > 0;
  }, [cart, user, cartShippingSuccess, cart_loading]);

  const handleUnauthenticated = () => {
    enableCart(false);
    setShowModal(false);
    setShouldAuthinticated(true);
  };

  // Load currencies and wallet data when modal opens
  useEffect(() => {
    if (!showModal) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const currRes = await getCurrencies({ local, handleUnauthenticated });

        if (currRes?.items && currRes.items.length > 0) {
          setCurrencies(currRes.items);

          // Auto-select the first currency that matches the current cart currency
          const matchingCurrency =
            currRes.items.find(
              (c) =>
                c.symbol === currency?.symbol || c.symbol === currency?.code,
            ) || currRes.items[0];

          setSelectedCurrency(matchingCurrency);

          // Load wallet balance for the selected currency
          const balRes = await GetWalletBalance({
            currencySymbol: matchingCurrency.symbol,
            local,
            handleUnauthenticated,
          });

          if (balRes) setWalletData(balRes);
        }
      } catch (error) {
        console.error("Failed to load wallet data", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [showModal, local, currency]);

  // Get available balance for selected currency
  const availableBalance = useMemo(() => {
    if (!walletData || !selectedCurrency) return 0;

    const wallet = walletData.wallets?.[0];
    const balanceEntry = wallet?.balances?.find(
      (b) =>
        b.assetSymbol === selectedCurrency.symbol ||
        b.assetId === selectedCurrency.id,
    );

    return balanceEntry?.available || 0;
  }, [walletData, selectedCurrency]);

  // Calculate checkout amount in selected currency
  const checkoutAmount = useMemo(() => {
    if (!total) return 0;

    return Number(
      RoundPrice({
        num: total,
        rate: currency?.exchange_rate || 1,
        points: currency?.decimal_digits ?? 2,
        returnNumber: true,
      }),
    );
  }, [total, currency]);

  const handleCheckout = async () => {
    if (!cart[0]?.cart_group_id || !selectedCurrency || checkoutAmount <= 0) {
      alert("Invalid cart data");
      return;
    }

    if (checkoutAmount > availableBalance) {
      alert("Insufficient balance in your wallet.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await CheckoutOrder({
        cartId: cart[0].cart_group_id,
        amount: checkoutAmount,
        currencyId: selectedCurrency.id,
        idempotencyKey: crypto.randomUUID(),
        local,
        handleUnauthenticated,
      });
      console.log("Checkout result:", result);

      if (result) {
        alert("Payment successful!");
        setShowModal(false);
        // Optionally refresh cart or redirect
        window.location.reload();
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCurrencyChange = async (
    newCurrency: CurrenciesApi["items"][0],
  ) => {
    setSelectedCurrency(newCurrency);
    setIsLoadingData(true);

    try {
      const balRes = await GetWalletBalance({
        currencySymbol: newCurrency.symbol,
        local,
        handleUnauthenticated,
      });

      if (balRes) setWalletData(balRes);
    } catch (error) {
      console.error("Failed to load balance for currency", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (!mounted || !shouldShowButton) return null;

  return createPortal(
    <>
      {/* Checkout Button - Bottom Left */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 left-8 z-[9999999999] bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
        aria-label="Checkout"
      >
        <svg
          className="w-6 h-6"
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
        <span>Checkout</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999999999] flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600"
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
                <h2 className="text-2xl font-bold text-gray-800">
                  Wallet Checkout
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {isLoadingData ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <>
                  {/* Currency Selection */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                      Select Payment Currency
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currencies.map((curr) => {
                        const isSelected = selectedCurrency?.id === curr.id;
                        const balance =
                          walletData?.wallets?.[0]?.balances?.find(
                            (b) => b.assetId === curr.id,
                          )?.available || 0;

                        return (
                          <button
                            key={curr.id}
                            onClick={() => handleCurrencyChange(curr)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? "bg-purple-50 border-purple-500 ring-2 ring-purple-200"
                                : "bg-white border-gray-200 hover:border-purple-300"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span
                                className={`text-xs font-bold px-2 py-1 rounded ${
                                  isSelected
                                    ? "bg-purple-200 text-purple-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {curr.symbol}
                              </span>
                              {isSelected && (
                                <svg
                                  className="w-5 h-5 text-purple-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-1">
                              Available
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                              {isSelected && isLoadingData ? (
                                <span className="text-sm animate-pulse">
                                  Loading...
                                </span>
                              ) : (
                                RoundPrice({
                                  num: balance,
                                  rate: 1,
                                  points: currency?.decimal_digits ?? 2,
                                })
                              )}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amount Summary */}
                  {selectedCurrency && (
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">
                        Payment Summary
                      </h3>

                      <div className="space-y-3">
                        <div className="flex justify-between text-gray-600">
                          <span>Cart Total:</span>
                          <span className="font-medium">
                            {RoundPrice({
                              num: total,
                              rate: currency?.exchange_rate || 1,
                              points: currency?.decimal_digits ?? 2,
                            })}{" "}
                            {currency?.symbol}
                          </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                          <span>Available Balance:</span>
                          <span
                            className={`font-medium ${
                              availableBalance < checkoutAmount
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {RoundPrice({
                              num: availableBalance,
                              rate: 1,
                              points: currency?.decimal_digits ?? 2,
                            })}{" "}
                            {selectedCurrency.symbol}
                          </span>
                        </div>

                        <div className="border-t border-purple-200 pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-800">
                              Amount to Pay:
                            </span>
                            <span className="text-2xl font-bold text-purple-600">
                              {RoundPrice({
                                num: checkoutAmount,
                                rate: 1,
                                points: currency?.decimal_digits ?? 2,
                              })}{" "}
                              {selectedCurrency.symbol}
                            </span>
                          </div>
                        </div>

                        {availableBalance < checkoutAmount && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">
                              ⚠️ Insufficient balance. Please add funds or
                              select a different currency.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={
                    isProcessing ||
                    isLoadingData ||
                    !selectedCurrency ||
                    availableBalance < checkoutAmount ||
                    checkoutAmount <= 0
                  }
                  className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Confirm Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
