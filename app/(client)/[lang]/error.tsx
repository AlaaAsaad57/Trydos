"use client";

// Route error boundary for everything under [lang]. Before this file existed a
// single Elasticsearch throw blanked the whole document, because the nearest
// boundary was app/global-error.tsx. Cache Components makes that worse: a
// throw inside one cached segment must not take the prerendered rest of the
// page with it.
//
// translateFunction comes from utils/functions, NOT utils/server — importing
// utils/server from a client component pulls ~416KB of translations into the
// browser bundle.

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { translateFunction, LogError } from "utils/functions";

export default function LocaleRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    LogError({
      scenario: "Route error boundary under [lang]",
      error: error?.message ?? String(error),
      digest: error?.digest,
    });
  }, [error]);

  const lang = String(useParams()?.lang ?? "");
  const language = lang.split("-")[1] || "en";

  return (
    <div
      role="alert"
      data-pw="route-error"
      className="flex flex-col items-center justify-center w-full py-[60px] gap-[12px]"
    >
      <p className="text-[#5d5d5d]">
        {translateFunction("Something went wrong", language)}
      </p>
      <p className="text-[#5d5d5d] text-[14px]">
        {translateFunction("We could not load this part of the page", language)}
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-[40px] px-[20px] rounded-[10px] bg-[#5d5d5d] text-white"
      >
        {translateFunction("Try again", language)}
      </button>
    </div>
  );
}
