"use client";

import { useSyncExternalStore } from "react";
import {
  isAutoSaving,
  subscribeToAutoSaving,
} from "components/Chat/autoDownload";

// The React hook for the blur in AutoSaveVeil. It lives in its own file because
// `autoDownload.ts` is also imported by non-client code (NotificationHandler),
// and a file that uses `useSyncExternalStore` must be a Client Component module.

/** True while this file is waiting for, or going through, its automatic save. */
export function useIsAutoSaving(filePath?: string): boolean {
  return useSyncExternalStore(
    subscribeToAutoSaving,
    () => !!filePath && isAutoSaving(filePath),
    () => false,
  );
}
