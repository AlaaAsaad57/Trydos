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

async function WalletLinkCard({
  isRtl,
  language,
  wallet,
  currency,
  country,
  local,
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={` ${
        isRtl && "items-end"
      } flex-col w-1/2 h-[94px] bg-[#F8F8F8] rounded-[12px] p-[12px]  cursor-pointer`}
      aria-label={translateFunction("Wallet Transactions", language)}
    >
      {open &&
        createPortal(
          <BottomSheet
            isOpen={open}
            onClose={() => {
              setOpen(false);
            }}
            height={80}
          >
            <TestNewWalletIntegrations country={country} local={local} />
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
          {wallet?.wallet_balance?.toFixed(currency?.decimal_digits)}{" "}
        </span>
        {currency?.symbol} {translateFunction("Your Balance", language)}
      </span>
    </div>
  );
}

export default WalletLinkCard;

function TestNewWalletIntegrations({ local, country }) {
  const [ActiveCurrency, setActiveCurrency] = useState<
    CurrenciesApi["items"][1] | null
  >(null);

  const [currenciesData, setCurrencies] = useState<
    CurrenciesApi["items"] | null
  >(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [step, setStep] = useState(1);

  // Data State
  const [banks, setBanks] = useState<BanksApi["items"]>([]);
  const [balances, setBalances] = useState<GetWalletBalancesApi | null>(null);
  const [history, setHistory] = useState<GetBankDepositeApi["items"]>([]);

  // Form State
  const [selectedBankId, setSelectedBankId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [feeDetails, setFeeDetails] = useState<CalculateFeesApi | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [bankRes, balanceRes, historyRes, currencies] = await Promise.all([
      GetBanks({ local: local }),
      GetWalletBalance({
        currencySymbol: "",
        local: local,
      }),
      GetBankDepostits({ local: local }),
      getCurrencies({ local }),
    ]);

    if (bankRes) setBanks(bankRes.items);
    if (balanceRes) {
      setBalances(balanceRes);
      setActiveTab(balanceRes.wallets[0]?.balances[0]?.assetSymbol || "");
    }
    if (historyRes) setHistory(historyRes.items);
    if (currencies) {
      setActiveCurrency(currencies?.items?.[0]);
      setCurrencies(currencies.items);
    }
  };

  // 1. Calculate Fees on amount change
  const handleAmountChange = async (val: number) => {
    setAmount(val);
    if (val > 0 && selectedBankId) {
      const res = await CalculateFees({
        amount: val,
        bankId: selectedBankId,
        currencyId: ActiveCurrency.id,
        local: local,
      });
      if (res) setFeeDetails(res);
    }
  };

  // 2. Upload Image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    // Simulation of UploadMediaApi call
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    const res = await UploadMedia({
      file: e.target?.files?.[0],
      local: local,
    });
    if (res) setImageUrl(res.url);
    setUploading(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen font-sans">
      {/* 1. CURRENCY TABS & BALANCE */}
      <div className="mb-8">
        <div className="flex border-b border-gray-200">
          {balances?.wallets[0]?.balances.map((b) => (
            <button
              key={b.assetId}
              onClick={() => {
                setActiveTab(b.assetSymbol);

                setActiveCurrency(
                  currenciesData?.find((cur) => cur.id === b.assetId),
                );
              }}
              className={`py-2 px-6 font-medium ${activeTab === b.assetSymbol ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              {b.assetSymbol}
            </button>
          ))}
        </div>
        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Available Balance</p>
            <h2 className="text-2xl font-bold">
              {balances?.wallets[0]?.balances.find(
                (b) => b.assetSymbol === activeTab,
              )?.available || 0}{" "}
              {activeTab}
            </h2>
          </div>
          <button
            onClick={() => setStep(1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            + New Deposit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* DEPOSIT FORM SECTION */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-bold mb-4">Request Deposit</h3>

          {/* Step 1: Select Bank */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Select Bank
            </label>
            <select
              className="mt-1 block w-full border rounded-md p-2"
              onChange={(e) => setSelectedBankId(e.target.value)}
            >
              <option value="">Choose a bank...</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Amount & Fees */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              type="number"
              className="mt-1 block w-full border rounded-md p-2"
              placeholder="0.00"
              onChange={(e) => handleAmountChange(Number(e.target.value))}
            />
            {feeDetails && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                <div className="flex justify-between">
                  <span>Fee:</span> <span>{feeDetails.feeAmount}</span>
                </div>
                <div className="flex justify-between font-bold mt-1 border-t pt-1">
                  <span>Net:</span>{" "}
                  <span>
                    {feeDetails.netAmount} {activeTab}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Transfer Receipt
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploading && (
              <p className="text-xs text-orange-500 mt-1 animate-pulse">
                Uploading...
              </p>
            )}
            {imageUrl && (
              <p className="text-xs text-green-600 mt-1">✓ Receipt uploaded</p>
            )}
          </div>

          <button
            disabled={!imageUrl || !amount || !selectedBankId}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
          >
            Submit Deposit Request
          </button>
        </div>

        {/* 2. DEPOSIT HISTORY / TRANSACTIONS */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold">Recent Requests & Transactions</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Bank</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    {item.transactionReference || "PENDING"}
                  </td>
                  <td className="px-4 py-3">{item.bank.name}</td>
                  <td className="px-4 py-3 font-bold">
                    {item.amount} {item.currency.symbol}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        item.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : item.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
