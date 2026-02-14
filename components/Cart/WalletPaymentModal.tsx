import React, { useEffect, useMemo, useState } from "react";
import { useAppStore } from "store";
import {
  CheckoutOrder,
  GetWalletBalance,
  getCurrencies,
} from "services/wallet";
import { CurrenciesApi, GetWalletBalancesApi } from "services/wallet/types";
import { RoundPrice, translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import { showErrorNotification } from "@/store/notifications/reducer";
import { createPortal } from "react-dom";

export default function WalletPaymentModal({
  onSuccess,
  onClose,
  walletAmount,
}) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [currencies, setCurrencies] = useState<CurrenciesApi["items"]>([]);
  const [walletData, setWalletData] = useState<GetWalletBalancesApi | null>(
    null,
  );
  const [selectedCurrency, setSelectedCurrency] = useState<
    CurrenciesApi["items"][0] | null
  >(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const { cart, currency, enableCart, setShouldAuthinticated, language } =
    useAppStore();

  const { lang } = useParams();
  const local = String(lang);
  const isRtl = language === "ar" || language === "ku";

  const handleUnauthenticated = () => {
    enableCart(false);
    onClose();
    setShouldAuthinticated(true);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const currRes = await getCurrencies({ local, handleUnauthenticated });
        if (!currRes?.items?.length) {
          showErrorNotification(
            translateFunction("Failed to load wallet currencies"),
          );
          onClose();
          return;
        }

        setCurrencies(currRes.items);

        const matchingCurrency =
          currRes.items.find(
            (c) => c.symbol === currency?.symbol || c.symbol === currency?.code,
          ) || currRes.items[0];

        setSelectedCurrency(matchingCurrency);

        const balRes = await GetWalletBalance({
          currencySymbol: matchingCurrency.symbol,
          local,
          handleUnauthenticated,
        });

        if (balRes) setWalletData(balRes);
      } catch (error) {
        showErrorNotification(translateFunction("Failed to load wallet data"));
        onClose();
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

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

  const checkoutAmount = useMemo(() => {
    if (!walletAmount) return 0;
    return Number(
      RoundPrice({
        num: walletAmount,
        rate: currency?.exchange_rate || 1,
        points: currency?.decimal_digits ?? 2,
        returnNumber: true,
      }),
    );
  }, [walletAmount, currency]);

  const isBalanceSufficient = availableBalance >= checkoutAmount;

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
      showErrorNotification(translateFunction("Failed to load wallet balance"));
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!cart[0]?.cart_group_id || !selectedCurrency || checkoutAmount <= 0) {
      showErrorNotification(translateFunction("Invalid cart data"));
      return;
    }

    if (!isBalanceSufficient) {
      showErrorNotification(translateFunction("Insufficient wallet balance"));
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

      if (result) {
        onSuccess();
      } else {
        showErrorNotification(
          translateFunction("Wallet payment failed. Please try again"),
        );
      }
    } catch (error) {
      showErrorNotification(
        translateFunction("Wallet payment failed. Please try again"),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <React.Fragment>
      <div
        className="fixed inset-0 z-[9999999998] bg-black/60"
        onClick={() => {
          if (!isProcessing) onClose();
        }}
      />
      <div
        className="fixed inset-0 z-[9999999999] flex items-center justify-center px-[16px]"
        onClick={() => {
          if (!isProcessing) onClose();
        }}
      >
        <div
          className="flex-col w-full max-w-[400px] bg-white rounded-[20px] overflow-hidden"
          style={{ boxShadow: "0px 4px 30px rgba(0,0,0,0.15)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`${isRtl ? "flex-row-reverse" : "flex-row"} items-center justify-between px-[20px] pt-[20px] pb-[12px]`}
          >
            <div
              className={`${isRtl ? "flex-row-reverse" : "flex-row"} items-center gap-[8px]`}
            >
              <img src="/icons/WalletIcon.svg" />
              <span className="semibold text-[16px] text-[#1D1D1D]">
                {translateFunction("Wallet Payment")}
              </span>
            </div>
            {!isProcessing && (
              <div className="cursor-pointer p-[4px]" onClick={onClose}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1L13 13M1 13L13 1"
                    stroke="#8D8D8D"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-col px-[20px] pb-[20px]">
            {isLoadingData ? (
              <div className="flex justify-center py-[40px]">
                <Spinner />
              </div>
            ) : (
              <>
                {/* Currency Selection */}
                {currencies.length > 1 && (
                  <div className="flex-col mb-[16px]">
                    <span className="regular text-[12px] text-[#8D8D8D] mb-[8px]">
                      {translateFunction("Select Currency")}
                    </span>
                    <div className="flex-row gap-[8px] flex-wrap">
                      {currencies.map((curr) => {
                        const isSelected = selectedCurrency?.id === curr.id;
                        return (
                          <div
                            key={curr.id}
                            onClick={() => handleCurrencyChange(curr)}
                            className={`cursor-pointer px-[14px] py-[8px] rounded-[12px] text-[12px] semibold ${
                              isSelected
                                ? "bg-[#346BFF] text-white"
                                : "bg-[#F8F8F8] text-[#1D1D1D]"
                            }`}
                            style={{
                              border: isSelected
                                ? "1px solid #346BFF"
                                : "1px solid transparent",
                            }}
                          >
                            {curr.symbol}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Payment Summary */}
                <div
                  className="flex-col bg-[#F8F8F8] rounded-[15px] p-[16px] gap-[12px]"
                  style={{
                    border: "1px solid rgb(196 194 194 / 51%)",
                  }}
                >
                  <div
                    className={`${isRtl ? "flex-row-reverse" : "flex-row"} justify-between items-center`}
                  >
                    <span className="regular text-[12px] text-[#8D8D8D]">
                      {translateFunction("Amount to Pay")}
                    </span>
                    <span className="semibold text-[14px] text-[#1D1D1D]">
                      {RoundPrice({
                        num: checkoutAmount,
                        rate: 1,
                        points: currency?.decimal_digits ?? 2,
                        returnNumber: false,
                      })}{" "}
                      {selectedCurrency?.symbol}
                    </span>
                  </div>

                  <div className="w-full h-[1px] bg-[#E8E8E8]" />

                  <div
                    className={`${isRtl ? "flex-row-reverse" : "flex-row"} justify-between items-center`}
                  >
                    <span className="regular text-[12px] text-[#8D8D8D]">
                      {translateFunction("Your Balance")}
                    </span>
                    <span
                      className={`semibold text-[14px] ${
                        isBalanceSufficient
                          ? "text-[#2DC653]"
                          : "text-[#F85555]"
                      }`}
                    >
                      {RoundPrice({
                        num: availableBalance,
                        rate: 1,
                        points: currency?.decimal_digits ?? 2,
                        returnNumber: false,
                      })}{" "}
                      {selectedCurrency?.symbol}
                    </span>
                  </div>

                  {!isBalanceSufficient && (
                    <div className="bg-[#FFF5F5] rounded-[10px] px-[12px] py-[8px]">
                      <span className="regular text-[11px] text-[#F85555]">
                        {translateFunction(
                          "Insufficient wallet balance for this payment",
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex-col gap-[10px] mt-[16px]">
                  <div
                    data-cy="wallet-confirm-payment"
                    onClick={() => {
                      if (!isProcessing && isBalanceSufficient) {
                        handleConfirmPayment();
                      }
                    }}
                    className={`w-full h-[50px] rounded-[15px] flex justify-center items-center cursor-pointer ${
                      isBalanceSufficient && !isProcessing
                        ? "bg-[#346BFF]"
                        : "bg-[#C4C2C2]"
                    } text-white semibold text-[14px]`}
                  >
                    {isProcessing ? (
                      <Spinner />
                    ) : (
                      translateFunction("Confirm Wallet Payment")
                    )}
                  </div>
                  {!isProcessing && (
                    <div
                      data-cy="wallet-cancel-payment"
                      onClick={onClose}
                      className="w-full h-[40px] rounded-[15px] flex justify-center items-center cursor-pointer bg-transparent text-[#8D8D8D] regular text-[13px]"
                    >
                      {translateFunction("Cancel")}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>,
    document.body,
  );
}
