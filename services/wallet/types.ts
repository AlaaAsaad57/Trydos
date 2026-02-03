/**
 * SHARED UTILITY TYPES
 */
export interface FetchResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  isError?: boolean;
  url?: string;
  success: boolean;
}

interface Timestamps {
  createdAt: string;
  updatedAt: string;
  deletedAt: any;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface CursorPagination {
  startCursor: string;
  endCursor: string;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  total: number;
}

interface FeeStructure {
  enabled: boolean;
  type: string;
  percentage: number;
  fixedAmount: number;
}

interface PaytabConfig {
  paytabEnabled: boolean;
  paytabFees: FeeStructure;
  paytabTax: FeeStructure;
}

interface BaseAsset {
  id: string;
  name: string;
  symbol: string;
}

interface BaseBank {
  id: string;
  name: string;
  code: string;
}

/**
 * REUSABLE COMPONENT TYPES
 */

export interface Transaction extends Timestamps {
  id: string;
  accountId: string;
  assetType: string;
  assetId: string;
  balanceId: string;
  assetSymbol: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  balanceField: string;
  title: string;
  journalEntryId: string;
}

export interface BankDepositItem extends Timestamps {
  id: string;
  amount: number;
  taxAmount: number;
  feeAmount: number;
  netAmount: number;
  transferImageUrl: string;
  transactionReference: string;
  status: string;
  rejectionReason: string;
  processedBy: string;
  processedAt: string;
  walletCredited: boolean;
  bank: BaseBank;
  currency: BaseAsset;
}

/**
 * EXPORTED API RESPONSES
 */

export interface BanksApi extends Pagination {
  items: Array<
    BaseBank &
      Timestamps & {
        description: string;
        swiftCode: string;
        depositAvailable: boolean;
        withdrawAvailable: boolean;
        isActive: boolean;
        currencies: Array<{
          currencyId: string;
          depositEnabled: boolean;
          withdrawEnabled: boolean;
          depositFee: FeeStructure;
          withdrawFee: FeeStructure;
          depositTax: FeeStructure;
          withdrawTax: FeeStructure;
          currency: BaseAsset &
            Timestamps & {
              symbolImageUrl: string;
              paytab: PaytabConfig;
              isActive: boolean;
            };
        }>;
      }
  >;
}

export interface CurrenciesApi extends Pagination {
  items: Array<
    BaseAsset &
      Timestamps & {
        displayName: string;
        symbolImageUrl: string;
        paytab: PaytabConfig;
      }
  >;
}

export interface UploadMediaApi extends Timestamps {
  id: string;
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: string;
  uploaderId: string;
  uploaderType: string;
  metadata: { purpose: string };
}

export interface CreateBankDepositeApi extends BankDepositItem {}

export interface GetBankDepositeApi extends Pagination {
  items: BankDepositItem[];
}

export interface CalculateFeesApi {
  amount: number;
  taxAmount: number;
  feeAmount: number;
  netAmount: number;
  totalDeductions: number;
  currencySymbol: string;
  bankNameEn: string;
  bankNameAr: string;
}

export interface GetWalletBalancesApi {
  currencySymbol: string;
  totalAvailable: number;
  totalLocked: number;
  totalValue: number;
  wallets: Array<
    Timestamps & {
      id: string;
      type: string;
      userId: string;
      subtype: string;
      status: string;
      name: string;
      balances: Array<{
        id: string;
        accountId: string;
        assetType: string;
        assetId: string;
        assetSymbol: string;
        available: number;
        locked: number;
        reserved: number;
        createdAt: string;
        updatedAt: string;
        asset: BaseAsset;
      }>;
    }
  >;
}

export interface GetJournalEntriesApi extends CursorPagination {
  items: Array<
    Timestamps & {
      id: string;
      debitAccountId: string;
      creditAccountId: string;
      creditAssetSymbol: string;
      creditAssetType: string;
      creditAssetId: string;
      debitAssetSymbol: string;
      debitAssetType: string;
      debitAssetId: string;
      amount: number;
      description: string;
      transactionIds: string[];
      idempotencyKey: string;
      transactions: Transaction[];
    }
  >;
}

export interface GetTransactionsApi extends CursorPagination {
  items: Transaction[];
}

export interface CheckoutOrderApi {
  success: boolean;
  status: string;
  currencyId: string;
  items: Array<{
    cartId: string;
    amount: number;
    status: string;
    receiptId: string;
  }>;
}
