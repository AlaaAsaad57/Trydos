"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { storeLastPaths } from "@/utils/history";

// PathTracker: listens to URL changes and stores last 4 paths
// Place this component in the root layout so it's always mounted on the client
const PathTracker = (): null => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const search = searchParams?.toString();
    const fullPath =
      search && search.length > 0 ? `${pathname}?${search}` : pathname;
    storeLastPaths(fullPath);
  }, [pathname, searchParams]);

  return null;
};

export default PathTracker;
