
export interface CurrencyApi {
    data: {
      currency: {
        id: number;
        name: any;
        symbol: string;
        code: string;
        exchange_rate: number;
      };
    };
  }