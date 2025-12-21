import Link from "next/link";

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
  "data-id"?: string;
  "data-name"?: string;
  "data-type"?: string;
  "data-image"?: string;
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
  ...props
}: INextLinkProps) {
  if (ignoreConditionCase) {
    return (
      <Link
        suppressHydrationWarning
        className={className}
        style={style}
        prefetch={true}
        href={href}
        data-cy={props["data-cy"] ?? ""}
        data-id={props["data-id"] ?? ""}
        data-name={props["data-name"] ?? ""}
        data-type={props["data-type"] ?? ""}
        data-image={props["data-image"] ?? ""}
      >
        {children}
      </Link>
    );
  }
  if (sameHref) {
    return (
      <div
        suppressHydrationWarning
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
      prefetch={true}
      href={href}
      data-id={props["data-id"] ?? ""}
      data-cy={props["data-cy"] ?? ""}
      data-name={props["data-name"] ?? ""}
      data-type={props["data-type"] ?? ""}
      data-image={props["data-image"] ?? ""}
    >
      {children}
    </Link>
  );
}
