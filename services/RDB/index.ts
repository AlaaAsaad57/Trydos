import * as actions from "./serverActions";

export const serverActions = {
  banking: {
    getCurrencies: actions.getCurrencies,
    GetBanks: actions.GetBanks,
    CreateBankDeposit: actions.CreateBankDeposit,
    GetBankDeposits: actions.GetBankDeposits,
    CalculateFees: actions.CalculateFees,
  },
  media: {
    UploadMedia: actions.UploadMedia,
  },
  transactions: {
    GetWalletBalance: actions.GetWalletBalance,
    GetJournalEntries: actions.GetJournalEntries,
    GetTransactions: actions.GetTransactions,
    CheckoutOrder: actions.CheckoutOrder,
  },
  wallets: {
    checkWallet: actions.checkWallet,
    createWallet: actions.createWallet,
  },
  auth: {
    sendOtp: actions.sendOtp,
    verifyOtp: actions.verifyOtp,
    reSendOtp: actions.reSendOtp,
    verifyMe: actions.verifyMe,
  },
};
