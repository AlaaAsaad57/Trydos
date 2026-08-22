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

/**
 * Returned by any wallet action when the wallet backend answers 401.
 * The action cannot run the caller's reaction itself — it is a Server Action,
 * so a client callback passed to it is only a reference, not a function.
 * The caller checks for this shape and reacts on the client.
 */
export interface WalletUnauthenticated {
  unauthenticated: true;
  status: 401;
  success: false;
  error: string;
  data: null;
}

/** Narrows any wallet action result to the 401 sentinel. */
export function isWalletUnauthenticated(
  response: unknown,
): response is WalletUnauthenticated {
  return (
    typeof response === "object" &&
    response !== null &&
    "unauthenticated" in response
  );
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
  id: "69a404e821c8a037f8b710ae";
  accountId: "69a2a948f2086d4e2d7de778";
  assetType: "CURRENCY";
  assetId: "69a2dc811d48445e622551ad";
  assetSymbol: "TRY";
  available: 0;
  locked: 0;
  reserved: 0;
  asset: {
    id: "69a2dc811d48445e622551ad";
    symbol: "TRY";
    name: "Turkish lira";
  };
  accountSubtype: "MAIN";
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
