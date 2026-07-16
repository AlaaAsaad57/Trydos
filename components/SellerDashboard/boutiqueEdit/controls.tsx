"use client";
import React from "react";
import { translateFunction } from "utils/functions";
import { DashField, dashInputClass, DashIcon } from "components/SellerDashboard/ui";
import type { IconName } from "components/SellerDashboard/ui";

const t = (s: string) => translateFunction(s);

export function Section({
  icon,
  title,
  desc,
  children,
}: {
  icon: IconName;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-[15px] p-5 lg:p-6"
      style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-start gap-2.5 mb-5 pb-4 border-b border-[#ededed]">
        <span className="text-[#5d5d5d] shrink-0 mt-0.5">
          <DashIcon name={icon} size={19} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] semibold text-[#3c3c3c]">{t(title)}</h2>
          {desc && <p className="text-[12px] text-[#8e8e8e] mt-0.5">{t(desc)}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{children}</div>
);

export function Txt({
  label,
  value,
  onChange,
  error,
  hint,
  disabled,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <DashField label={required ? `${t(label)} *` : t(label)} error={error && t(error)} hint={hint}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${dashInputClass} ${error ? "border-[#f85555]" : ""} ${disabled ? "opacity-70" : ""}`}
      />
    </DashField>
  );
}

export function Area({
  label,
  value,
  onChange,
  disabled,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <DashField label={t(label)}>
      <textarea
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${dashInputClass} h-auto py-3 leading-relaxed ${disabled ? "opacity-70" : ""}`}
      />
    </DashField>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  disabled,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  error?: string;
  required?: boolean;
}) {
  return (
    <DashField label={required ? `${t(label)} *` : t(label)} error={error && t(error)}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${dashInputClass} ${error ? "border-[#f85555]" : ""} ${disabled ? "opacity-70" : ""}`}
      >
        <option value="">{t("Select")}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.label)}
          </option>
        ))}
      </select>
    </DashField>
  );
}

/**
 * "Copy from ▾" — pulls an already-filled field from another language into the
 * current one. Renders nothing when disabled or when no other language has this
 * field filled. Native select arrow (no custom icon dependency).
 */
export function CopyFrom({
  options,
  onPick,
  disabled,
}: {
  options: { code: string; label: string }[];
  onPick: (code: string) => void;
  disabled?: boolean;
}) {
  if (disabled || options.length === 0) return null;
  return (
    <select
      value=""
      onChange={(e) => {
        const code = e.target.value;
        if (code) onPick(code);
        e.currentTarget.value = "";
      }}
      title={t("Copy from another language")}
      className="text-[11px] medium text-[#388CFF] bg-[#388CFF]/[0.07] hover:bg-[#388CFF]/[0.14] rounded-md px-2 h-[26px] cursor-pointer transition-colors focus:outline-none border-0"
    >
      <option value="">{t("Copy from")}…</option>
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Label row (label + optional trailing action, e.g. CopyFrom) above a control. */
export function FieldShell({
  label,
  required,
  action,
  error,
  shakeTick = 0,
  children,
}: {
  label: string;
  required?: boolean;
  action?: React.ReactNode;
  error?: string;
  shakeTick?: number;
  children: React.ReactNode;
}) {
  // When a save fails, `shakeTick` bumps; keying the wrapper on it remounts the
  // node so the CSS shake animation re-plays on every attempt, not just once.
  const shaking = !!error && shakeTick > 0;
  return (
    <div key={shaking ? `shake-${shakeTick}` : undefined} className={shaking ? "shake-anim" : ""}>
      <div className="flex items-center justify-between gap-2 mb-1.5 min-h-[26px]">
        <label className="text-[13px] medium text-[#3c3c3c]">
          {t(label)}
          {required ? " *" : ""}
        </label>
        {action}
      </div>
      {children}
      {error && <p className="text-[11px] text-[#f85555] mt-1">{t(error)}</p>}
    </div>
  );
}

/** Shared input/textarea class re-export so sections can build raw fields. */
export { dashInputClass };

/** Selection = outline + faint tint (design-language §10.8), never checkbox. */
export function Chip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-3.5 h-[34px] rounded-full text-[13px] medium border transition-colors active:scale-[0.98] disabled:cursor-not-allowed ${
        active
          ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#3c3c3c]"
          : "border-transparent bg-[#f2f2f2] text-[#8e8e8e] hover:text-[#505050]"
      } ${disabled && !active ? "opacity-60" : ""}`}
    >
      {children}
    </button>
  );
}

export function Toggle({
  label,
  desc,
  value,
  onChange,
  disabled,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded-[12px] bg-[#f8f8f8] border border-[#ededed]">
      <div className="min-w-0">
        <p className="text-[13px] medium text-[#3c3c3c]">{t(label)}</p>
        {desc && <p className="text-[12px] text-[#8e8e8e] mt-0.5">{t(desc)}</p>}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative shrink-0 w-[44px] h-[26px] rounded-full transition-colors disabled:opacity-50 ${
          value ? "bg-[#5d5d5d]" : "bg-[#d9d9de]"
        }`}
      >
        <span
          className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow transition-all ${
            value ? "left-[21px]" : "left-[3px]"
          }`}
        />
      </button>
    </div>
  );
}
