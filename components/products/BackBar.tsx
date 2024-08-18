"use client";
import React, { useEffect } from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import { useRouter } from "next/navigation";
import { dispatchRouteChangeEvent } from "Hooks/events";
import { useSelector } from "react-redux";
import { LogData } from "store/homepage/actions";
function BackBar({
  close,
  link,
  className,
  data,
}: {
  className?: any;
  close: any;
  link: any;
  data?: any;
}) {
  useEffect(() => {
    LogData(data);
  }, []);
  const router = useRouter();
  const activeRoute = useSelector((state: any) => state.details.activeRoute);
  return (
    <div className="back-bar align-center w-100 flex-row">
      <div
        className={`back-icon flex-row ${className}`}
        onClick={() => {
          if (link) {
            if (activeRoute === "/") {
              window.location.href = `/`;
              // dispatchRouteChangeEvent("start", {
              //   to: "HomePage",
              //   from: "details",
              // });

              //   router.push(`/`);
              // document.documentElement.style.overflow = "hidden";
              // document.documentElement.scrollTop = 0;
            } else {
              window.location.href = activeRoute;
              // dispatchRouteChangeEvent("start", {
              //   to: "boutique",
              //   from: "details",
              // });
              // window.location.href=(activeRoute);
              // router.push(activeRoute);
              // document.documentElement.style.overflow = "hidden";
              // document.documentElement.scrollTop = 0;
            }
          } else close();
        }}
      >
        <BackIcon />
      </div>
    </div>
  );
}

export default BackBar;
