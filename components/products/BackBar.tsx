"use client";
import React, { useEffect } from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import { useParams, useRouter } from "next/navigation";
import { dispatchRouteChangeEvent } from "utils/events";
import { useSelector } from "react-redux";
import { LogData } from "store/homepage/actions";
import NextLink from "components/global/NextLink";
import { PrefetchKind } from "node_modules/next/dist/client/components/router-reducer/router-reducer-types";
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
  const activeRoute = useSelector(
    (state: StateInterface) => state.homepage.activeRoute
  );
  const { lang } = useParams();
  useEffect(() => {
    if (activeRoute === "/" || !activeRoute)
      router.prefetch(`/${lang}`, {
        kind: PrefetchKind.FULL,
      });
    else
      router.prefetch(`${activeRoute}`, {
        kind: PrefetchKind.FULL,
      });
  }, []);
  return (
    <div className="back-bar align-center w-100 flex-row">
      <NextLink
        href={link ? activeRoute : "#"}
        data-cy="backIcon_productPage"
        className={`back-icon flex-row ${className}`}
        onClick={() => {
          if (link) {
            if (activeRoute === "/") {
              // dispatchRouteChangeEvent("start", {
              //   to: "HomePage",
              //   from: "details",
              // });
              //   router.push(`/`);
              // document.documentElement.style.overflow = "hidden";
              // document.documentElement.scrollTop = 0;
            } else {
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
      </NextLink>
    </div>
  );
}

export default BackBar;
