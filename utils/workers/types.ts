// TypeScript types for Web Worker message passing

export interface CountriesResult {
  countries: any[];
}

export interface CurrencyResult {
  currency: any;
}

export interface LoginCheckResult {
  success: boolean;
  data?: any;
}

// Worker Request Messages
export type WorkerRequest =
  | {
      type: "FETCH_COUNTRIES";
      payload: {
        country: string;
        language: string;
      };
    }
  | {
      type: "GET_CURRENCY";
      payload: Record<string, never>;
    }
  | {
      type: "CHECK_LOGIN";
      payload: Record<string, never>;
    }
  | {
      type: "GET_REFERRAL_SOURCE";
      payload: {
        referer: string | null;
      };
    }
  | {
      type: "GET_CLIENT_DATA";
      payload: Record<string, never>;
    }
  | {
      type: "CLEANUP";
      payload: Record<string, never>;
    };

// Worker Response Messages
export type WorkerResponse =
  | {
      type: "WORKER_READY";
    }
  | {
      type: "COUNTRIES_RESULT";
      payload: CountriesResult;
      error?: string;
    }
  | {
      type: "CURRENCY_RESULT";
      payload: CurrencyResult;
      error?: string;
    }
  | {
      type: "LOGIN_CHECK_RESULT";
      payload: LoginCheckResult;
      error?: string;
    }
  | {
      type: "REFERRAL_SOURCE_RESULT";
      payload: { source: string };
      error?: string;
    }
  | {
      type: "CLIENT_DATA_RESULT";
      payload: any;
      error?: string;
    }
  | {
      type: "ERROR";
      payload: {
        message: string;
        type: string;
      };
    };

export interface WorkerState {
  worker: Worker | null;
  isReady: boolean;
}
