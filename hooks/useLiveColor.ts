"use client";
import { useSearchParams } from "next/navigation";

// Live search-param value. Query-only navigations reuse the stale RSC payload
// (experimental.staleTimes.dynamic), so server components never see the new
// value — useSearchParams does. Falls back to the value the server rendered
// with so hydration matches.
export function useLiveParam(name: string, serverValue?: string) {
  const searchParams = useSearchParams();
  return searchParams.get(name) ?? serverValue;
}

export function useLiveColor(serverColor?: string) {
  return useLiveParam("color", serverColor);
}
