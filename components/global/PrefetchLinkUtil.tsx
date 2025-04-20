"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
function PrefetchLinkUtil({ href, label }) {
  const router = useRouter();
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log("prefetching...", href);
            router.prefetch(href, {
              kind: PrefetchKind.FULL,
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    const element = document.querySelector(`a[aria-label="${label}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [href]);

  return <></>;
}

export default PrefetchLinkUtil;
