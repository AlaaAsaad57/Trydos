"use client";

// eslint-disable-next-line no-restricted-imports
import Link from "next/link";
import React, { ComponentProps, MouseEventHandler, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PrefetchKind } from "node_modules/next/dist/client/components/router-reducer/router-reducer-types";

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
  const router = useRouter();

  return (
    <Link
      className={className}
      href={href}
      {...props}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
    >
      <>{children}</>
    </Link>
  );
}
