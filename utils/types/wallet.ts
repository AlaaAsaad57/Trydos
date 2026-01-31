export interface Currencies {
  items: Array<{
    name: string;
    displayName: string;
    id: string;
    symbol: string;
    symbolImageUrl: string;
    paytab: {
      paytabEnabled: boolean;
      paytabFees: {
        enabled: boolean;
        type: string;
        percentage: number;
        fixedAmount: number;
      };
      paytabTax: {
        enabled: boolean;
        type: string;
        percentage: number;
        fixedAmount: number;
      };
    };
    deletedAt: any;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
