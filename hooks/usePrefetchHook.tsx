import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PrefetchKind } from "node_modules/next/dist/client/components/router-reducer/router-reducer-types";

export function usePrefetchLinks() {
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  const observeLinks = () => {
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach((link) => observerRef.current?.observe(link));
  };

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            if (link.href) {
              console.log(`Prefetching : ${link.href}`);
              router.prefetch(link.href, { kind: PrefetchKind.FULL });
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "50px",
        threshold: 0.1,
      }
    );

    // Watch for DOM changes to catch dynamically added links
    mutationObserverRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          observeLinks();
        }
      });
    });

    // Initial observation
    observeLinks();

    // Start watching for DOM changes
    mutationObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
      mutationObserverRef.current?.disconnect();
    };
  }, [router]);
}
