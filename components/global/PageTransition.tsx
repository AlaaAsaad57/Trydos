"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "public/styles/pageTransition.css";
import { getCurrency } from "utils/tinyUtils";

import { useAppStore } from "store";
function PageTransition({ children, init }) {
  const { setCurrency } = useAppStore();
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const direction = prevPathname < pathname ? "forward" : "backward";
  useEffect(() => {
    if (prevPathname && prevPathname !== pathname) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setIsAnimating(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
    setPrevPathname(pathname);
  }, [pathname]);

  useEffect(() => {
    let country = init?.split("-")[0];
    getCurrency({
      callback: ({ currency, res }) => {
        let ciel = null;
        if (country === "sy") {
          ciel = parseInt(process.env.NEXT_PUBLIC_SY_CIEL);
        } else if (country === "lb") {
          ciel = parseInt(process.env.NEXT_PUBLIC_LB_CIEL);
        }
        setCurrency({ ...currency, ceil: ciel });
      },
    });
  }, []);
  return (
    <div
      className={`home-page-container min-h-screen ${
        isAnimating ? direction : ""
      } `}
    >
      {children}
    </div>
  );
}

export default PageTransition;
