"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "store";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { GAevent } from "utils/gtag";

export interface INextLinkProps {
  href: string;
  ariaLabel?: string;
  data?: any;
  exportparts?: string;
  ignoreConditionCase?: boolean;
  sameHref?: boolean;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  id?: string;
  onClick?: any;
  isFromSetting?: boolean;
  fromRecomended?: any;
  disableScroll?: boolean;
}
export default function NextLink({
  sameHref,
  href,
  className,
  children,
  ariaLabel,
  style,
  exportparts,
  data,
  ignoreConditionCase = false,
  onClick,
  isFromSetting,
  fromRecomended = null,
  disableScroll = true,
  ...props
}: INextLinkProps) {
  const pathname = usePathname();
  const { setIsNavigating, setLastPathname, setColorBottomSheet } =
    useAppStore();
  if (ignoreConditionCase) {
    return (
      <Link
        suppressHydrationWarning
        className={className}
        data-cy={props["data-cy"] ?? ""}
        style={style}
        prefetch={"auto"}
        href={href}
        onNavigate={(e) => {
          if (isFromSetting) {
            let element = document.querySelector(".setting-screen");

            if (element) {
              element.classList.add("loading-page-class");
              return;
            }
          }
          setColorBottomSheet(null);

          setLastPathname(pathname);
        }}
        onClick={() => {
          if (fromRecomended) {
            GAevent({
              action: GA_EVENT_NAMES.RECOMENDED,
              params: fromRecomended,
            });
          }
          if (isFromSetting) {
            let element = document.querySelector(".setting-screen");

            if (element) {
              element.classList.add("loading-page-class");
              return;
            }
          }
          if (onClick) {
            onClick();
          }

          setColorBottomSheet(null);
          setLastPathname(pathname);
          setIsNavigating(data);
        }}
      >
        {children}
      </Link>
    );
  }
  if (sameHref) {
    return (
      <div
        suppressHydrationWarning
        onClick={() => {
          if (onClick) {
            onClick();
          }
        }}
        className={className}
        style={style}
        data-cy={props["data-cy"] ?? ""}
        data-id={props["data-id"] ?? ""}
        data-name={props["data-name"] ?? ""}
        data-type={props["data-type"] ?? ""}
        data-image={props["data-image"] ?? ""}
      >
        {children}
      </div>
    );
  }
  return (
    <Link
      suppressHydrationWarning
      className={className}
      style={style}
      data-cy={props["data-cy"] ?? ""}
      prefetch={"auto"}
      onNavigate={(e) => {
        if (isFromSetting) {
          let element = document.querySelector(".setting-screen");

          if (element) {
            element.classList.add("loading-page-class");
            return;
          }
        }

        setColorBottomSheet(null);

        setLastPathname(pathname);
      }}
      onClick={() => {
        if (fromRecomended) {
          GAevent({
            action: GA_EVENT_NAMES.RECOMENDED,
            params: fromRecomended,
          });
        }
        if (isFromSetting) {
          let element = document.querySelector(".setting-screen");

          if (element) {
            element.classList.add("loading-page-class");
            return;
          }
        }
        if (onClick) {
          onClick();
        }

        setColorBottomSheet(null);

        setLastPathname(pathname);
        setIsNavigating(data);
      }}
      href={href}
    >
      {children}
    </Link>
  );
}
