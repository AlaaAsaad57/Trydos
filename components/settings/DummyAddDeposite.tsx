"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import {
  CalculateFees,
  CreateBankDeposit,
  GetBankDepostits,
  GetBanks,
  UploadMedia,
  getCurrencies,
} from "services/wallet";
import {
  BanksApi,
  CalculateFeesApi,
  CurrenciesApi,
  GetBankDepositeApi,
} from "services/wallet/types";
import Spinner from "components/global/Spinner";
import { translateFunction } from "utils/functions";

function DummyAddDeposite() {
  const { setShouldAuthinticated, shouldAuthinticated, user, setLoginOpen } =
    useAppStore();
  const { lang } = useParams();
  const local = String(lang || "gb-en");

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState<CurrenciesApi["items"]>([]);
  const [banks, setBanks] = useState<BanksApi["items"]>([]);
  const [activeCurrency, setActiveCurrency] = useState<
    CurrenciesApi["items"][0] | null
  >(null);
  const [history, setHistory] = useState<GetBankDepositeApi["items"]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "deposit">("history");

  const [selectedBankId, setSelectedBankId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [feeDetails, setFeeDetails] = useState<CalculateFeesApi | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isBankSupportedForCurrency = (
    bank: BanksApi["items"][number],
    currencyId: string,
  ) => {
    if (!bank.isActive || !bank.depositAvailable) return false;
    return bank.currencies.some(
      (item) =>
        item.currencyId === currencyId &&
        item.depositEnabled &&
        item.currency?.isActive,
    );
  };

  const handleUnauthenticated = () => {
    setShouldAuthinticated(true);
    setIsOpen(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (shouldAuthinticated && isOpen) {
      setIsOpen(false);
    }
  }, [shouldAuthinticated, isOpen]);

  useEffect(() => {
    if (!isOpen || shouldAuthinticated) return;

    const loadGlobalConfig = async () => {
      setLoading(true);
      try {
        const [currRes, bankRes] = await Promise.all([
          getCurrencies({ local, handleUnauthenticated }),
          GetBanks({ local, handleUnauthenticated }),
        ]);

        if (bankRes?.items) setBanks(bankRes.items);
        if (currRes?.items?.length) {
          setCurrencies(currRes.items);
          setActiveCurrency((prev) => prev ?? currRes.items[0]);
        }
      } catch (error) {
        console.error("Failed to load wallet config", error);
      } finally {
        setLoading(false);
      }
    };

    loadGlobalConfig();
  }, [isOpen, local, shouldAuthinticated]);

  useEffect(() => {
    if (!isOpen || shouldAuthinticated || !activeCurrency) return;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const histRes = await GetBankDepostits({
          local,
          handleUnauthenticated,
        });
        if (histRes?.items) setHistory(histRes.items);
      } catch (error) {
        console.error("Failed to load deposit history", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [activeCurrency, isOpen, local, shouldAuthinticated]);

  const filteredHistory = useMemo(() => {
    if (!activeCurrency) return history;
    return history.filter((item) => item.currency?.id === activeCurrency.id);
  }, [activeCurrency, history]);

  const availableBanks = useMemo(() => {
    if (!activeCurrency) return [];
    return banks.filter((bank) =>
      isBankSupportedForCurrency(bank, activeCurrency.id),
    );
  }, [activeCurrency, banks]);

  useEffect(() => {
    if (!selectedBankId || !activeCurrency) return;
    const selectedBank = banks.find((bank) => bank.id === selectedBankId);
    if (
      !selectedBank ||
      !isBankSupportedForCurrency(selectedBank, activeCurrency.id)
    ) {
      setSelectedBankId("");
      setFeeDetails(null);
    }
  }, [activeCurrency, banks, selectedBankId]);

  const resetForm = () => {
    setSelectedBankId("");
    setAmount(0);
    setFeeDetails(null);
    setImageUrl("");
  };

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

  const handleBankChange = async (bankId: string) => {
    if (!bankId) {
      setSelectedBankId("");
      setFeeDetails(null);
      return;
    }

    if (!activeCurrency) return;

    const bank = banks.find((item) => item.id === bankId);
    if (!bank || !isBankSupportedForCurrency(bank, activeCurrency.id)) {
      setSelectedBankId("");
      setFeeDetails(null);
      return;
    }

    setSelectedBankId(bankId);
    if (amount > 0) {
      const res = await CalculateFees({
        amount,
        bankId,
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
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await UploadMedia({
        file,
        local,
        handleUnauthenticated,
      });
      console.log(res);
      if (res?.url) setImageUrl(res.url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
      input.value = "";
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

      const newHistory = await GetBankDepostits({
        local,
        handleUnauthenticated,
      });
      if (newHistory?.items) setHistory(newHistory.items);

      resetForm();
      setActiveTab("history");
    } catch (error) {
      console.error("Deposit failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpen = () => {
    if (user && user?.phone?.length > 3) {
      setIsOpen(true);
      return;
    }
    setLoginOpen(true);
  };

  const handleCopyId = async (id: string) => {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
    } catch (error) {
      console.error("Failed to copy id", error);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full mt-[12px] flex-row items-center justify-between min-h-[56px] bg-[#F8F8F8] rounded-[15px] px-[12px]"
      >
        <div className="flex-row items-center gap-[10px]">
          <img
            src="/icons/TryDosWalletIcon.svg"
            className="w-[22px] h-[22px]"
          />
          <span className="text-[#1D1D1D] text-[14px] regular">
            {translateFunction("Wallet Deposits")}
          </span>
        </div>
        <span className="text-[#8D8D8D] text-[12px] regular">
          {translateFunction("View / Create")}
        </span>
      </button>

      {isOpen &&
        mounted &&
        !shouldAuthinticated &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999999999] flex items-center justify-center bg-black/60 px-[12px]"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="p-4 w-full max-w-[620px] bg-white rounded-[20px] overflow-hidden"
              style={{ boxShadow: "0px 4px 30px rgba(0,0,0,0.15)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-row items-center justify-between px-[18px] pt-[18px] pb-[12px] border-b border-[#F0F0F0]">
                <div className="flex-row items-center gap-[8px]">
                  <img
                    src="/icons/WalletIcon.svg"
                    className="w-[18px] h-[18px]"
                  />
                  <span className="semibold text-[16px] text-[#1D1D1D]">
                    {translateFunction("Wallet Deposits")}
                  </span>
                </div>
                <button
                  type="button"
                  className="p-[4px]"
                  onClick={() => setIsOpen(false)}
                >
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
                </button>
              </div>

              <div className="flex-row gap-[8px] px-[18px] pt-[12px]">
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`px-[14px] py-[8px] rounded-[12px] text-[12px] semibold ${
                    activeTab === "history"
                      ? "bg-[#346BFF] text-white"
                      : "bg-[#F8F8F8] text-[#1D1D1D]"
                  }`}
                >
                  {translateFunction("Deposits")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("deposit")}
                  className={`px-[14px] py-[8px] rounded-[12px] text-[12px] semibold ${
                    activeTab === "deposit"
                      ? "bg-[#346BFF] text-white"
                      : "bg-[#F8F8F8] text-[#1D1D1D]"
                  }`}
                >
                  {translateFunction("Create Deposit")}
                </button>
              </div>

              <div className="px-[18px] py-[16px] max-h-[75vh] overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-[40px]">
                    <Spinner />
                  </div>
                ) : (
                  <>
                    {currencies.length > 0 && (
                      <div className="mt-4 mb-4 flex-row gap-[8px] flex-wrap ">
                        {currencies.map((currency) => {
                          const isSelected = activeCurrency?.id === currency.id;
                          return (
                            <button
                              key={currency.id}
                              type="button"
                              onClick={() => setActiveCurrency(currency)}
                              className={`px-[12px] py-[6px] rounded-[10px] text-[12px] semibold ${
                                isSelected
                                  ? "bg-[#1D1D1D] text-white"
                                  : "bg-[#F8F8F8] text-[#1D1D1D]"
                              }`}
                            >
                              {currency.symbol}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {activeTab === "history" ? (
                      <div className="flex-col gap-[12px]">
                        {isLoadingHistory ? (
                          <div className="flex justify-center py-[30px]">
                            <Spinner />
                          </div>
                        ) : filteredHistory.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[12px]">
                              <thead className="bg-[#F8F8F8] text-[#8D8D8D]">
                                <tr>
                                  <th className="px-[10px] py-[10px]">
                                    {translateFunction("ID")}
                                  </th>
                                  <th className="px-[10px] py-[10px]">
                                    {translateFunction("Date")}
                                  </th>
                                  <th className="px-[10px] py-[10px]">
                                    {translateFunction("Bank")}
                                  </th>
                                  <th className="px-[10px] py-[10px]">
                                    {translateFunction("Amount")}
                                  </th>
                                  <th className="px-[10px] py-[10px]">
                                    {translateFunction("Fee")}
                                  </th>
                                  <th className="px-[10px] py-[10px]">
                                    {translateFunction("Tax")}
                                  </th>
                                  <th className="px-[10px] py-[10px]">
                                    {translateFunction("Net Amount")}
                                  </th>
                                  <th className="px-[10px] py-[10px]">
                                    {translateFunction("Status")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#F0F0F0]">
                                {filteredHistory.map((item) => (
                                  <tr key={item.id} className="text-[#1D1D1D]">
                                    <td className="px-[10px] py-[10px]">
                                      <button
                                        type="button"
                                        onClick={() => handleCopyId(item.id)}
                                        className="text-[#346BFF] underline cursor-pointer"
                                      >
                                        {item.id}
                                      </button>
                                    </td>
                                    <td className="px-[10px] py-[10px] text-[#8D8D8D]">
                                      {new Date(
                                        item.createdAt,
                                      ).toLocaleDateString()}
                                    </td>
                                    <td className="px-[10px] py-[10px]">
                                      {item.bank?.name || "-"}
                                    </td>
                                    <td className="px-[10px] py-[10px]">
                                      {item.amount.toLocaleString()}{" "}
                                      {item.currency?.symbol}
                                    </td>
                                    <td className="px-[10px] py-[10px]">
                                      {item.feeAmount?.toLocaleString?.() ?? 0}{" "}
                                      {item.currency?.symbol}
                                    </td>
                                    <td className="px-[10px] py-[10px]">
                                      {item.taxAmount?.toLocaleString?.() ?? 0}{" "}
                                      {item.currency?.symbol}
                                    </td>
                                    <td className="px-[10px] py-[10px]">
                                      {item.netAmount?.toLocaleString?.() ?? 0}{" "}
                                      {item.currency?.symbol}
                                    </td>
                                    <td className="px-[10px] py-[10px]">
                                      <StatusBadge status={item.status} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center text-[12px] text-[#8D8D8D] py-[24px]">
                            {translateFunction("No deposits found")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-col gap-[14px]">
                        <div>
                          <label className="block text-[12px] text-[#8D8D8D] mb-[6px]">
                            {translateFunction("Source Bank")}
                          </label>
                          <select
                            className="w-full text-[#1D1D1D] border border-[#E6E6E6] rounded-[10px] p-[10px] text-[12px]"
                            onChange={(e) => handleBankChange(e.target.value)}
                            value={selectedBankId}
                          >
                            <option value="">
                              {translateFunction("Select a bank")}
                            </option>
                            {availableBanks.map((bank) => (
                              <option key={bank.id} value={bank.id}>
                                {bank.name}
                              </option>
                            ))}
                          </select>
                          {activeCurrency && availableBanks.length === 0 && (
                            <p className="text-[11px] text-[#B26A00] mt-[6px]">
                              {translateFunction(
                                "No banks support this currency for deposit",
                              )}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[12px] text-[#8D8D8D] mb-[6px]">
                            {translateFunction("Amount")}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              className="w-full text-[#1D1D1D] border border-[#E6E6E6] rounded-[10px] p-[10px] text-[12px]"
                              placeholder="0.00"
                              value={amount || ""}
                              onChange={(e) =>
                                handleAmountChange(Number(e.target.value))
                              }
                            />
                            <span className="absolute right-[12px] top-[10px] text-[12px] text-[#8D8D8D]">
                              {activeCurrency?.symbol}
                            </span>
                          </div>
                        </div>

                        {feeDetails && (
                          <div className="bg-[#F8F8F8] rounded-[12px] p-[12px] text-[12px]">
                            <div className="flex-row justify-between text-[#8D8D8D]">
                              <span>{translateFunction("Fee")}</span>
                              <span>
                                {feeDetails.feeAmount} {activeCurrency?.symbol}
                              </span>
                            </div>
                            <div className="flex-row justify-between text-[#8D8D8D]">
                              <span>{translateFunction("Tax")}</span>
                              <span>
                                {feeDetails.taxAmount} {activeCurrency?.symbol}
                              </span>
                            </div>
                            <div className="flex-row justify-between text-[#1D1D1D] semibold mt-[6px]">
                              <span>{translateFunction("You Receive")}</span>
                              <span>
                                {feeDetails.netAmount} {activeCurrency?.symbol}
                              </span>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[12px] text-[#8D8D8D] mb-[6px]">
                            {translateFunction("Proof of Transfer")}
                          </label>
                          <div className="border border-dashed border-[#DADADA] rounded-[10px] p-[12px] text-center relative">
                            <input
                              type="file"
                              onChange={handleFileUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <span className="text-[12px] text-[#8D8D8D]">
                              {isUploading ? (
                                translateFunction("Uploading...")
                              ) : imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt="Proof of Transfer"
                                  className="w-full h-auto object-cover rounded-[10px]"
                                />
                              ) : (
                                translateFunction("Click to upload")
                              )}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSubmitDeposit}
                          disabled={
                            isSubmitting ||
                            !imageUrl ||
                            !amount ||
                            !selectedBankId
                          }
                          className="w-full bg-[#1D1D1D] text-white py-[10px] rounded-[12px] text-[13px] semibold disabled:bg-[#C9C9C9]"
                        >
                          {isSubmitting
                            ? translateFunction("Processing...")
                            : translateFunction("Submit Deposit")}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    APPROVED: "bg-[#DFF7E5] text-[#2E7D32]",
    REJECTED: "bg-[#FFE5E5] text-[#C62828]",
    PENDING: "bg-[#FFF3CD] text-[#B26A00]",
  } as const;
  const activeStyle =
    styles[status as keyof typeof styles] || "bg-[#F0F0F0] text-[#6B6B6B]";

  return (
    <span
      className={`px-[8px] py-[2px] rounded-full text-[10px] uppercase ${activeStyle}`}
    >
      {status}
    </span>
  );
}

export default DummyAddDeposite;
