"use client";
import Link from "next/link";
import { usePathname } from "node_modules/next/navigation";
import { useAppStore } from "store";
import { DisableScroll } from "utils/tinyUtils";

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
            console.log(element, "onNavigate");
            if (element) {
              element.classList.add("loading-page-class");
              return;
            }
          }
          setColorBottomSheet(null);

          DisableScroll();
          setLastPathname(pathname);
        }}
        onClick={() => {
          if (isFromSetting) {
            let element = document.querySelector(".setting-screen");
            console.log(element, "onCLick");
            if (element) {
              element.classList.add("loading-page-class");
              return;
            }
          }
          if (onClick) {
            onClick();
          }
          DisableScroll();
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
          console.log(element, "onNavigate");
          if (element) {
            element.classList.add("loading-page-class");
            return;
          }
        }
        DisableScroll();
        setColorBottomSheet(null);

        setLastPathname(pathname);
      }}
      onClick={() => {
        if (isFromSetting) {
          let element = document.querySelector(".setting-screen");
          console.log(element, "onCLick");
          if (element) {
            element.classList.add("loading-page-class");
            return;
          }
        }
        if (onClick) {
          onClick();
        }
        DisableScroll();
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
