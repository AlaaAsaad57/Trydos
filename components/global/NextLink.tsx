import Link from "next/link";
import React, { ComponentProps, Suspense } from "react";
import PrefetchLinkUtil from "./PrefetchLinkUtil";

export interface INextLinkProps
  extends Omit<ComponentProps<typeof Link>, "href"> {
  href: string;
}
export default function NextLink({
  href,
  className,
  children,
  onClick,
  ...props
}: INextLinkProps) {
  return (
    <Link
      className={className}
      prefetch
      href={href}
      {...props}
      // onClick={(e) => {
      //   if (onClick) onClick(e);
      // }}
    >
      <Suspense key={href} fallback={<></>}>
        <PrefetchLinkUtil href={href} />
      </Suspense>
      <>{children}</>
    </Link>
  );
}
