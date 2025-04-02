"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "public/styles/pageTransition.css";
import { getCurrency } from "store/chat/actions";
import { useDispatch } from "node_modules/react-redux/es";
function PageTransition({ children, init }) {
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
  const dispatch = useDispatch();

  useEffect(() => {
    let country = init?.split("-")[0];
    getCurrency({
      lang: init.split("-")[1],
      country: init.split("-")[0],
      callback: ({ currency, res }) => {
        let ciel = null;
        if (country === "sy") {
          ciel = parseInt(process.env.NEXT_PUBLIC_SY_CIEL);
        } else if (country === "lb") {
          ciel = parseInt(process.env.NEXT_PUBLIC_LB_CIEL);
        }
        dispatch({ type: "CURRENCY", payload: { ...currency, ceil: ciel } });
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
