export interface GetWalletApi {
    limit: number;
    offset: number;
    wallet_balance: number;
    currency_symbol: string;
    currency_code: string;
    total_wallet_transaction: number;
    wallet_transaction_list: any[];
  }