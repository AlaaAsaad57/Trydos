"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "public/styles/pageTransition.css";
function PageTransition({ children }) {
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
