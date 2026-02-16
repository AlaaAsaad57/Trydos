"use server";

import * as core from "rdb/core";
// let core: any = {};
// Re-export individual functions so Next.js recognizes them as Server Actions
export const getCurrencies = core.getCurrencies;
export const GetBanks = core.GetBanks;
export const CreateBankDeposit = core.CreateBankDeposit;
export const GetBankDeposits = core.GetBankDeposits;
export const CalculateFees = core.CalculateFees;

export const UploadMedia = core.UploadMedia;

export const GetWalletBalance = core.GetWalletBalance;
export const GetJournalEntries = core.GetJournalEntries;
export const GetTransactions = core.GetTransactions;
export const CheckoutOrder = core.CheckoutOrder;

export const checkWallet = core.checkWallet;
export const createWallet = core.createWallet;

export const sendOtp = core.sendOtp;
export const verifyOtp = core.verifyOtp;
export const reSendOtp = core.reSendOtp;
export const verifyMe = core.verifyMe;
