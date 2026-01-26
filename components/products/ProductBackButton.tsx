"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ProductCartHeader from "./ProductCartHeader";
import { useAppStore } from "store";

function ProductBackButton({ lang }) {
  const router = useRouter();
  const { setIsNavigating, lastPathname } = useAppStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Clear navigation state on mount
    setIsNavigating(null);
  }, [setIsNavigating]);

  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";

  const handleBack = () => {
    // Keywords that trigger the boutique navigation state
    const boutiqueKeywords = ["boutiques", "filters", "featured", "flashdeals"];

    // Check if lastPathname exists and matches any keyword
    const isBoutiquePath =
      lastPathname &&
      boutiqueKeywords.some((key) => lastPathname.includes(key));

    if (isBoutiquePath) {
      setIsNavigating({ is_boutique: true });
    } else {
      setIsNavigating({ is_full_home: true });
    }

    // Navigation logic
    if (lastPathname) {
      router.back();
    } else {
      // Fallback for direct entry or page refresh (where lastPathname is null)
      router.push(`/${lang}`);
    }
  };

  if (!mounted) {
    return <div className="h-[50px] w-full" />;
  }

  return (
    <div
      className={`back-bar flex items-center w-full h-[50px] justify-between px-[10px] shadow-[0px_0px_6px_rgba(0,0,0,0.1)] ${
        isRtl ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        data-cy="backIcon_productPage"
        onClick={handleBack}
        className="back-icon flex cursor-pointer"
      >
        <img
          src="/icons/backIcon.svg"
          className={`${isRtl ? "rotate-180" : ""}`}
        />
      </div>
      <ProductCartHeader language={language} />
    </div>
  );
}

export default ProductBackButton;
