"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { WorkerRequest, WorkerResponse } from "./types";

interface UseInitWorkerCallbacks {
  onCountriesResult?: (countries: any[]) => void;
  onCurrencyResult?: (currency: any) => void;
  onLoginCheckResult?: (result: any) => void;
  onReferralSourceResult?: (source: string) => void;
  onClientDataResult?: (data: any) => void;
  onError?: (error: string, type: string) => void;
}

export function useInitWorker(callbacks: UseInitWorkerCallbacks) {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Initialize worker
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    try {
      // Create worker from the worker file
      const worker = new Worker(
        new URL("./initSiteData.worker.ts", import.meta.url),
        { type: "module" }
      );

      // Set up message handler
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type } = event.data;

        switch (type) {
          case "WORKER_READY":
            setIsReady(true);
            break;

          case "COUNTRIES_RESULT": {
            const { payload, error } = event.data;
            if (error) {
              callbacksRef.current.onError?.(error, "FETCH_COUNTRIES");
            } else {
              callbacksRef.current.onCountriesResult?.(payload.countries);
            }
            break;
          }

          case "CURRENCY_RESULT": {
            const { payload, error } = event.data;
            if (error) {
              callbacksRef.current.onError?.(error, "GET_CURRENCY");
            } else {
              callbacksRef.current.onCurrencyResult?.(payload.currency);
            }
            break;
          }

          case "LOGIN_CHECK_RESULT": {
            const { payload, error } = event.data;
            if (error) {
              callbacksRef.current.onError?.(error, "CHECK_LOGIN");
            } else {
              callbacksRef.current.onLoginCheckResult?.(payload);
            }
            break;
          }

          case "REFERRAL_SOURCE_RESULT": {
            const { payload, error } = event.data;
            if (error) {
              callbacksRef.current.onError?.(error, "GET_REFERRAL_SOURCE");
            } else {
              callbacksRef.current.onReferralSourceResult?.(payload.source);
            }
            break;
          }

          case "CLIENT_DATA_RESULT": {
            const { payload, error } = event.data;
            if (error) {
              callbacksRef.current.onError?.(error, "GET_CLIENT_DATA");
            } else {
              callbacksRef.current.onClientDataResult?.(payload);
            }
            break;
          }

          case "ERROR": {
            const { payload } = event.data;
            callbacksRef.current.onError?.(payload.message, payload.type);
            break;
          }

          default:
            console.warn("Unknown worker response type:", type);
        }
      };

      // Error handler
      worker.onerror = (error) => {
        console.error("Worker error:", error);
        callbacksRef.current.onError?.(
          error.message || "Worker error",
          "WORKER_ERROR"
        );
      };

      workerRef.current = worker;

      // Cleanup on unmount
      return () => {
        if (workerRef.current) {
          workerRef.current.postMessage({
            type: "CLEANUP",
            payload: {},
          } as WorkerRequest);
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };
    } catch (error) {
      console.error("Failed to initialize worker:", error);
      callbacksRef.current.onError?.(
        error instanceof Error ? error.message : String(error),
        "WORKER_INIT"
      );
    }
  }, []);

  // Helper function to send messages to worker
  const postMessage = useCallback(
    (message: WorkerRequest) => {
      if (workerRef.current && isReady) {
        workerRef.current.postMessage(message);
      } else {
        console.warn("Worker not ready yet. Message queued:", message.type);
        // Optionally, you could implement a queue here
      }
    },
    [isReady]
  );

  // Convenience methods for common operations
  const fetchCountries = useCallback(
    (country: string, language: string) => {
      postMessage({
        type: "FETCH_COUNTRIES",
        payload: { country, language },
      });
    },
    [postMessage]
  );

  const getCurrency = useCallback(() => {
    postMessage({
      type: "GET_CURRENCY",
      payload: {},
    });
  }, [postMessage]);

  const checkLogin = useCallback(() => {
    postMessage({
      type: "CHECK_LOGIN",
      payload: {},
    });
  }, [postMessage]);

  const getReferralSource = useCallback(
    (referer: string | null) => {
      postMessage({
        type: "GET_REFERRAL_SOURCE",
        payload: { referer },
      });
    },
    [postMessage]
  );

  const getClientData = useCallback(() => {
    postMessage({
      type: "GET_CLIENT_DATA",
      payload: {},
    });
  }, [postMessage]);

  return {
    isReady,
    fetchCountries,
    getCurrency,
    checkLogin,
    getReferralSource,
    getClientData,
    postMessage,
  };
}
