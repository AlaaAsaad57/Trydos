import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { dispatchRouteChangeEvent } from "utils/events";

export default function useNextRouter() {
  const router = useRouter();
  const routerProxyRef = useRef<ReturnType<typeof useNextRouter> | null>(null);

  useEffect(() => {
    const routerProxy = new Proxy(router, {
      get: (target, prop) => {
        if (prop === "push" || prop === "back") {
          return (...args: unknown[]) => {
            dispatchRouteChangeEvent("start");

            // Call the original method with the provided arguments
            // @ts-ignore
            return target[prop](...args);
          };
        }

        // For other properties/methods, return the original value
        return target[prop];
      },
    });

    routerProxyRef.current = routerProxy;

    return () => {
      routerProxyRef.current = null;
    };
  }, [router]);

  return routerProxyRef.current || router;
}
