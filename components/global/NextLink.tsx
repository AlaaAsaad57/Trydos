import Link from "next/link";
import React, { ComponentProps, Suspense } from "react";
import PrefetchLinkUtil from "./PrefetchLinkUtil";

export interface INextLinkProps
  extends Omit<ComponentProps<typeof Link>, "href"> {
  href: string;
  ariaLabel?: string;
}
export default function NextLink({
  href,
  className,
  children,
  onClick,
  ariaLabel,
  ...props
}: INextLinkProps) {
  return (
    <Link
      aria-label={ariaLabel}
      className={className}
      prefetch
      href={href}
      {...props}
      // onClick={(e) => {
      //   if (onClick) onClick(e);
      // }}
    >
      <Suspense key={href} fallback={<></>}>
        <PrefetchLinkUtil href={href} label={ariaLabel} />
      </Suspense>
      <>{children}</>
    </Link>
  );
}
