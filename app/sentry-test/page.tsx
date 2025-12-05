"use client";

import React, { useCallback, useMemo, useState } from "react";
import * as Sentry from "@sentry/nextjs";

interface ButtonProps {
  label: string;
  id: string;
  onPress: () => void;
  isLoading?: boolean;
}

function ActionButton({ label, id, onPress, isLoading = false }: ButtonProps) {
  return (
    <button
      id={id}
      type="button"
      className="w-full sm:w-auto rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={label}
      onClick={onPress}
      disabled={isLoading}
    >
      {isLoading ? "Working…" : label}
    </button>
  );
}

export default function SentryTestPage() {
  const [lastAction, setLastAction] = useState<string>("");
  const [isServerCallLoading, setIsServerCallLoading] =
    useState<boolean>(false);

  const handleThrowError = useCallback(() => {
    setLastAction("Throwing a client error");
    // This will be captured by Sentry via the ErrorBoundary
    throw new Error("Sentry test: client-side exception");
  }, []);

  const handleCaptureMessage = useCallback(() => {
    setLastAction("Capturing a message");
    Sentry.captureMessage("Sentry test: client-side message", "warning");
  }, []);

  const handleTriggerServerError = useCallback(async () => {
    setIsServerCallLoading(true);
    setLastAction("Calling server route to trigger error");
    try {
      const res = await fetch("/api/sentry-test", {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
      });
      if (!res.ok) {
        // Intentionally ignore body
        return;
      }
    } catch (err) {
      // Network errors are fine here; Sentry will capture on the server
    } finally {
      setIsServerCallLoading(false);
    }
  }, []);

  const info = useMemo(() => {
    return [
      "Client exception: throws an actual error (should show error boundary).",
      "Client message: sends a non-fatal message to Sentry.",
      "Server error: calls API route that captures an exception on the server.",
    ];
  }, []);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Sentry Test</h1>

      <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-2 text-lg font-medium">What this page does</h2>
        <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700 dark:text-gray-300">
          {info.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <ActionButton
          id="throw-client-error"
          label="Throw client error"
          onPress={handleThrowError}
        />
        <ActionButton
          id="capture-message"
          label="Capture client message"
          onPress={handleCaptureMessage}
        />
        <ActionButton
          id="trigger-server-error"
          label="Trigger server error"
          onPress={handleTriggerServerError}
          isLoading={isServerCallLoading}
        />
      </div>

      <p
        className="mt-4 text-sm text-gray-600 dark:text-gray-400"
        aria-live="polite"
      >
        Last action: {lastAction || "None yet"}
      </p>
    </main>
  );
}
