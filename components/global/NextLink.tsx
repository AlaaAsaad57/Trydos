"use client";

// eslint-disable-next-line no-restricted-imports
import Link from "next/link";
import React, { ComponentProps, MouseEventHandler, useEffect } from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    onClick?.(e);
  };

  return (
    <Link
      prefetch={true}
      className={className}
      href={href}
      {...props}
      rel="prefetch"
      onClick={(e) => {
        onClick(e);
      }}
    >
      <>{children}</>
    </Link>
  );
}
