"use client";
import React from "react";
import Spinner from "components/global/Spinner";
import { translateFunction } from "utils/functions";
import { DashIcon, IconName } from "./icons";

export { DashIcon };
export type { IconName };

/**
 * Seller-dashboard design tokens, lifted from the live storefront *as the
 * designer actually shipped it* (see `orders.tsx`, the reference section) so the
 * dashboard reads as one continuous product:
 *  - primary CTA  = slate grey #5d5d5d  (neutral primary action, tint #f0f0f0)
 *  - accent/link  = blue    #388CFF  (filter icon, links, active underline)
 *  - danger/brand = red     #f85555  (errors, destructive, the live bag family)
 *  - cards        = 15px radius + soft single shadow
 *  - type         = Quicksand weight utility classes (medium / semibold / bold)
 *  - press        = active:scale-[0.98] (the storefront tap feel)
 */
export const DASH = {
  primary: "#5d5d5d",
  primaryHover: "#4a4a4a",
  primaryTint: "#f0f0f0",
  accent: "#388CFF",
  danger: "#f85555",
  dangerHover: "#e84444",
  warning: "#e6b400",
  success: "#2ea84f",
  disabled: "#C4C2C2",
  text: "#3c3c3c",
  textSec: "#505050",
  muted: "#8e8e8e",
  faint: "#c4c2c2",
  surface: "#f8f8f8",
  surfaceAlt: "#f4f4f4",
  hairline: "#ededed",
  cardShadow: "0 3px 10px rgba(0,0,0,0.1)",
} as const;

/* ----------------------------------------------------------------------- */
/* Card                                                                    */
/* ----------------------------------------------------------------------- */
export function DashCard({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-[15px] ${padded ? "p-5 lg:p-6" : ""} ${className}`}
      style={{ boxShadow: DASH.cardShadow }}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Monogram — initials avatar in a tinted rounded square.                  */
/* Mirrors the storefront identity-card / story-avatar motif: when a shop  */
/* has no logo we render its initials, never an empty grey box.            */
/* ----------------------------------------------------------------------- */
export function Monogram({
  name,
  src,
  size = 48,
  rounded = 15,
  className = "",
}: {
  name?: string;
  src?: string | null;
  size?: number;
  rounded?: number;
  className?: string;
}) {
  const initials = (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: src ? undefined : DASH.primaryTint,
        color: DASH.primary,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || ""}
          className="w-full h-full object-cover"
        />
      ) : initials ? (
        <span className="bold" style={{ fontSize: size * 0.4 }}>
          {initials}
        </span>
      ) : (
        <DashIcon name="shopInfo" size={size * 0.5} />
      )}
    </span>
  );
}

/* ----------------------------------------------------------------------- */
/* Section header (leading line icon + title + optional right slot)        */
/* ----------------------------------------------------------------------- */
export function SectionHeader({
  icon,
  title,
  count,
  right,
  className = "",
}: {
  icon?: IconName;
  title: string;
  count?: number;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 mb-4 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span className="text-[#5d5d5d] shrink-0">
            <DashIcon name={icon} size={20} />
          </span>
        )}
        <h2 className="text-[16px] semibold text-[#3c3c3c] truncate">{title}</h2>
        {typeof count === "number" && (
          <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-[#5d5d5d]/10 text-[#5d5d5d] text-[11px] semibold">
            {count}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Segmented control — grey track, active = white pill + primary outline.  */
/* The design-language segmented/sub-tab pattern (§6.9).                    */
/* ----------------------------------------------------------------------- */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex p-1 rounded-full bg-[#f4f4f4] ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`px-4 h-[34px] rounded-full text-[13px] medium transition-all active:scale-[0.98] ${
              active
                ? "bg-white text-[#5d5d5d] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                : "text-[#8e8e8e] hover:text-[#505050]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Button                                                                  */
/* ----------------------------------------------------------------------- */
type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-[#5d5d5d] text-white hover:bg-[#4a4a4a]",
  secondary:
    "bg-white text-[#388CFF] border border-[#388CFF] hover:bg-[#388CFF]/[0.06]",
  danger:
    "bg-[#fff1f1] text-[#f85555] border border-[#ffd9d9] hover:bg-[#ffe6e6]",
  ghost: "bg-[#f4f4f4] text-[#505050] hover:bg-[#ededed]",
};

export function DashButton({
  variant = "primary",
  loading = false,
  icon,
  iconRight,
  children,
  className = "",
  fullWidth = false,
  size = "md",
  ...props
}: {
  variant?: Variant;
  loading?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
  size?: "sm" | "md";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeClass =
    size === "sm"
      ? "h-[34px] px-3 text-[12px] rounded-[10px] gap-1.5"
      : "h-[44px] px-5 text-[14px] rounded-[12px] gap-2";
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex cursor-pointer items-center justify-center medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${sizeClass} ${VARIANT_CLASS[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          {icon && <DashIcon name={icon} size={size === "sm" ? 15 : 17} />}
          {children}
          {iconRight && (
            <DashIcon name={iconRight} size={size === "sm" ? 15 : 17} />
          )}
        </>
      )}
    </button>
  );
}

/* ----------------------------------------------------------------------- */
/* Status pill (outline + faint tint, brand selection style)              */
/* ----------------------------------------------------------------------- */
export function StatusPill({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] semibold ${
        active
          ? "bg-[#eaf7ef] text-[#2ea84f]"
          : "bg-[#f2f2f2] text-[#8e8e8e]"
      }`}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------------- */
/* Centred state blocks: loading / error / empty / access-denied          */
/* ----------------------------------------------------------------------- */
export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-14">
      <Spinner />
      <span className="ml-3 text-[14px] text-[#505050]">
        {label || translateFunction("Loading...")}
      </span>
    </div>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  subtitle,
  action,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <span className="w-[72px] h-[72px] mb-4 rounded-full bg-[#f4f4f4] text-[#c4c2c2] flex items-center justify-center">
        <DashIcon name={icon} size={34} strokeWidth={1.4} />
      </span>
      <p className="text-[15px] medium text-[#3c3c3c]">{title}</p>
      {subtitle && (
        <p className="text-[13px] text-[#8e8e8e] mt-1 max-w-[320px]">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <span className="w-[72px] h-[72px] mb-4 rounded-full bg-[#fff1f1] text-[#f85555] flex items-center justify-center">
        <DashIcon name="alert" size={32} strokeWidth={1.4} />
      </span>
      <p className="text-[14px] text-[#f85555] mb-4 max-w-[360px]">{message}</p>
      {onRetry && (
        <DashButton variant="secondary" onClick={onRetry} size="sm">
          {translateFunction("Retry")}
        </DashButton>
      )}
    </div>
  );
}

export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <span className="w-[72px] h-[72px] mb-4 rounded-full bg-[#f4f4f4] text-[#c4c2c2] flex items-center justify-center">
        <DashIcon name="lock" size={32} strokeWidth={1.4} />
      </span>
      <p className="text-[15px] medium text-[#3c3c3c]">
        {translateFunction("Access Denied")}
      </p>
      {message && (
        <p className="text-[13px] text-[#8e8e8e] mt-1 max-w-[320px]">
          {message}
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Inline alert banners (success / error)                                  */
/* ----------------------------------------------------------------------- */
export function InlineAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: React.ReactNode;
}) {
  const cls =
    tone === "success"
      ? "bg-[#eaf7ef] text-[#2ea84f] border-[#bfe6cc]"
      : "bg-[#fff1f1] text-[#f85555] border-[#ffd9d9]";
  return (
    <div
      className={`flex items-center gap-2 mb-4 p-3 rounded-[12px] border text-[13px] ${cls}`}
    >
      <DashIcon name={tone === "success" ? "check" : "alert"} size={16} />
      <span>{children}</span>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Pagination (prev / page x of y / next)                                  */
/* ----------------------------------------------------------------------- */
export function Pagination({
  current,
  last,
  disabled,
  onPrev,
  onNext,
}: {
  current: number;
  last: number;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <DashButton
        variant="secondary"
        size="sm"
        icon="chevronLeft"
        onClick={onPrev}
        disabled={current <= 1 || disabled}
      >
        {translateFunction("Previous")}
      </DashButton>
      <span className="text-[13px] text-[#8e8e8e]">
        {translateFunction("Page")} {current} / {last}
      </span>
      <DashButton
        variant="secondary"
        size="sm"
        iconRight="chevronRight"
        onClick={onNext}
        disabled={current >= last || disabled}
      >
        {translateFunction("Next")}
      </DashButton>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Text input + label (brand field)                                        */
/* ----------------------------------------------------------------------- */
export function DashField({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <label className="block text-[13px] medium text-[#505050] mb-1.5">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[12px] text-[#f85555] mt-1 flex items-center gap-1">
          <DashIcon name="alert" size={13} />
          {error}
        </p>
      ) : (
        hint && <p className="text-[12px] text-[#8e8e8e] mt-1">{hint}</p>
      )}
    </div>
  );
}

export const dashInputClass =
  "w-full px-4 h-[48px] bg-[#f8f8f8] border border-[#ededed] rounded-[12px] text-[14px] text-[#3c3c3c] placeholder:text-[#b8b8b8] outline-none focus:border-[#5d5d5d] focus:bg-white transition-colors";
