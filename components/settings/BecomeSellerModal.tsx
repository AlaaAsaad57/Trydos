"use client";
import { useEffect, useState } from "react";
import Spinner from "components/global/Spinner";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import {
  showErrorNotification,
  showSuccessNotification,
} from "@/store/notifications/reducer";
import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import Map from "components/Cart/Map"; // Ensure this path matches where you save the Map component below
import { FlagIcon } from "utils/tinyUtils";
import { getLocalizedCountryName } from "utils/countryData";
import { GetCountries } from "serverRequests/product";
import { isValidPhone } from "utils/phone";

const VENDOR_DOCUMENT_TYPES = [
  { value: "identity", label: "Identity" },
  { value: "passport", label: "Passport" },
  { value: "commercial_license", label: "Commercial License" },
  { value: "tax_certificate", label: "Tax Certificate" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "address_proof", label: "Address Proof" },
  { value: "authorization_letter", label: "Authorization Letter" },
];

// Shared field chrome — hairline card, 10px radius, indigo focus ring.
// FIELD_BASE omits the border/focus colours so FormInput can swap in a red
// error state (Tailwind precedence follows CSS source order, not the order of
// classes in the attribute, so we compose rather than append an override).
const FIELD_BASE =
  "w-full h-[44px] rounded-[10px] border bg-white " +
  "text-[13px] text-[#3c3c3c] placeholder:text-[#929191] outline-none transition-colors";

const FIELD_CLASS = `${FIELD_BASE} border-[#e6e6e6] focus:border-[#402CDD] focus:ring-2 focus:ring-[#402CDD]/20`;

// Credential validation. Email requires a real 2+ char TLD and no whitespace;
// password must be at least 8 chars with a letter and a number. Phone reuses
// the shared E.164 helper (utils/phone) so it stays consistent with login.
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || "").trim());

const isStrongPassword = (password: string) =>
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password || "");

// Vendor documents may only be images or PDFs. The `accept` attribute is a hint
// the OS file picker can ignore (drag/drop, "all files"), so we re-check here by
// MIME type, falling back to the extension when the browser reports no type.
const ACCEPTED_DOC_ACCEPT = "image/*,application/pdf";
const ACCEPTED_DOC_EXTENSIONS =
  /\.(jpe?g|png|gif|webp|avif|heic|heif|bmp|svg|pdf)$/i;

const isAllowedDocFile = (file: File | null) => {
  if (!file) return false;
  if (file.type) {
    return file.type.startsWith("image/") || file.type === "application/pdf";
  }
  // Some browsers/OSes report an empty MIME type — fall back to the extension.
  return ACCEPTED_DOC_EXTENSIONS.test(file.name || "");
};

// Plain required text fields → their "<Field> is required" message key. The
// credential fields (email/phone/password/repeat_password) have their own
// format rules and are handled explicitly in fieldError().
const REQUIRED_FIELD_MESSAGES: Record<string, string> = {
  f_name: "First Name is required",
  l_name: "Last Name is required",
  shop_name: "Shop Name is required",
  shop_address: "Shop Address is required",
  location_name: "Location Name is required",
  location_address: "Location Address is required",
};

const FieldLabel = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="text-[12px] font-medium text-[#505050]">
    {children}
  </label>
);

const ChevronDown = ({ className = "" }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// Leading indigo accent + dark label — replaces the centered grey caps header.
const SectionHeader = ({ children }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="w-[3px] h-[14px] rounded-full bg-[#402CDD]" />
    <h3 className="text-[13px] font-semibold tracking-wide text-[#3c3c3c]">
      {children}
    </h3>
  </div>
);

// Reusable Input Component
const FormInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur = undefined,
  placeholder,
  error = "",
}) => {
  const stateClass = error
    ? "border-[#f85555] focus:border-[#f85555] focus:ring-2 focus:ring-[#f85555]/20"
    : "border-[#e6e6e6] focus:border-[#402CDD] focus:ring-2 focus:ring-[#402CDD]/20";

  return (
    <div className="flex flex-col gap-1.5 w-full items-start">
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <input
        id={name}
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={`${FIELD_BASE} px-3.5 ${stateClass}`}
      />
      {error && <span className="text-[11px] text-[#f85555]">{error}</span>}
    </div>
  );
};

// Country picker: native <select> (accessible, RTL-safe) with the selected
// country's flag rendered inside the field. Default value comes from the URL.
const CountrySelect = ({
  label,
  name,
  value,
  onChange,
  countries,
  language,
}) => {
  const current = (value || "").toLowerCase();
  const hasCurrent = countries.some(
    (c) => (c.iso || "").toLowerCase() === current,
  );

  return (
    <div className="flex flex-col gap-1.5 w-full items-start">
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <div className="relative w-full">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex w-[24px] h-[16px] items-center overflow-hidden rounded-[2px]">
          <FlagIcon iso={current} />
        </span>
        <select
          id={name}
          name={name}
          value={current}
          onChange={onChange}
          className={`${FIELD_CLASS} appearance-none px-[40px] cursor-pointer`}
        >
          {current && !hasCurrent && (
            <option value={current}>
              {getLocalizedCountryName(current, language)}
            </option>
          )}
          {countries.map((c) => {
            const code = (c.iso || "").toLowerCase();
            return (
              <option key={c.id ?? code} value={code}>
                {getLocalizedCountryName(code, language)}
              </option>
            );
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#929191]" />
      </div>
    </div>
  );
};

// Result-screen icons (28px, matched to the rest of the modal's SVG style).
const ClockIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const CrossIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

// One card layout shared by every non-form outcome (pending / rejected /
// approved / error). `iconWrapClass` carries literal Tailwind colour classes so
// they survive the JIT purge; `footer` supplies the action button(s).
const StatusScreen = ({
  onClose,
  cancelLabel,
  iconWrapClass,
  icon,
  title,
  body,
  footer,
}) => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/45 animate-fade-in font-sans"
    style={{ zIndex: 999999999 }}
  >
    <div
      className="relative flex flex-col items-center w-[90vw] max-w-[420px] bg-white rounded-[15px] p-7 text-center shadow-[0_3px_10px_rgba(0,0,0,0.1)]"
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label={cancelLabel}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#929191] hover:bg-[#f2f2f2] hover:text-[#3c3c3c] transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full ${iconWrapClass}`}
      >
        {icon}
      </span>

      <h2 className="mt-4 text-[16px] font-semibold text-[#3c3c3c]">{title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[#707070]">{body}</p>

      {footer}
    </div>
  </div>
);

export default function BecomeSellerModal({ onClose }) {
  const { lang } = useParams();
  // @ts-ignore
  const [country,languageVariable] = lang?.split("-");
  const t = (key: string) => translateFunction(key, languageVariable);

  const [loading, setLoading] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  // What the modal renders, driven by the caller's live vendor-request status
  // (no local persistence — the backend is the single source of truth).
  const [view, setView] = useState<
    "loading" | "error" | "form" | "pending" | "rejected" | "approved"
  >("loading");
  const [rejectionReason, setRejectionReason] = useState("");
  // Inline validation messages, keyed by field name (email/phone/password/…).
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { setAddressDetails, setShouldAuthinticated, setReAuthResult } =
    useAppStore();

  // Read the caller's own vendor request and branch the modal on its status.
  // No request on record → show the application form; a live PENDING/REJECTED/
  // APPROVED shows the matching status screen instead of the form.
  const fetchVendorRequest = async () => {
    setView("loading");
    const res = await fetchData({
      url: "/shop/vendor-requests",
      method: "GET",
      reqTitle: REQUESTS_DATA.VENDOR_REQUEST,
      server: "market",
      // We own all messaging on this screen; suppress fetchData's own toast.
      noMessage: true,
    });

    if (!res?.success) {
      // A 404 is the backend's "you never applied" → let them apply. Any other
      // failure (network/5xx) is a real error the user can retry.
      setView(Number(res?.code) === 404 ? "form" : "error");
      return;
    }

    const status = String(res?.data?.status ?? "").toUpperCase();
    if (status === "PENDING") {
      setView("pending");
    } else if (status === "REJECTED") {
      setRejectionReason(res?.data?.rejection_reason || res?.data?.reason || "");
      setView("rejected");
    } else if (status === "APPROVED") {
      setView("approved");
    } else {
      // Success but no request/unknown status → treat as "never applied".
      setView("form");
    }
  };

  useEffect(() => {
    fetchVendorRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [form, setForm] = useState({
    f_name: "",
    l_name: "",
    email: "",
    phone: "",
    password: "",
    repeat_password: "",
    currency_code: "USD",
    country_iso: country,
    language_code: "en",
    shop_name: "",
    shop_address: "",
    location_country_iso: country,
    location_name: "",
    location_address: "",
    latitude: "",
    longitude: "",
    documents: [],
  });

  // document upload state
  const [newDocType, setNewDocType] = useState("");
  const [newDocFile, setNewDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear a field's error as soon as the user edits it.
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  // Per-field credential validation → returns a translated message or "".
  const fieldError = (name: string, values = form) => {
    switch (name) {
      case "email":
        if (!values.email.trim()) return t("Email is required");
        return isValidEmail(values.email)
          ? ""
          : t("Enter a valid email address");
      case "phone":
        if (!values.phone.trim()) return t("Phone number is required");
        return isValidPhone(values.phone) ? "" : t("Invalid Phone Number");
      case "password":
        if (!values.password) return t("Password is required");
        return isStrongPassword(values.password)
          ? ""
          : t("Min 8 characters, including a letter and a number");
      case "repeat_password":
        if (!values.repeat_password) return t("Please repeat your password");
        return values.password === values.repeat_password
          ? ""
          : t("Passwords do not match");
      default:
        // Plain required text fields: non-empty check with a translated message.
        if (REQUIRED_FIELD_MESSAGES[name]) {
          return String(values[name] ?? "").trim()
            ? ""
            : t(REQUIRED_FIELD_MESSAGES[name]);
        }
        return "";
    }
  };

  // Validate a single credential field on blur for immediate feedback.
  const handleBlur = (e) => {
    const { name } = e.target;
    setErrors((prev) => ({ ...prev, [name]: fieldError(name) }));
  };

  // Load the selectable country list (mirrors PersonalInfoCountries:
  // session cache keyed by country+language, falling back to GetCountries).
  useEffect(() => {
    if (!country) return;
    const load = async () => {
      const key = `countries-${country}-${languageVariable}`;
      try {
        const cached = sessionStorage.getItem(key);
        if (cached) {
          setCountries(JSON.parse(cached));
          return;
        }
        const data = await GetCountries({ country, language: languageVariable });
        if (Array.isArray(data) && data.length) {
          sessionStorage.setItem(key, JSON.stringify(data));
          setCountries(data);
        }
      } catch {
        // Keep the URL country as the sole option if the list can't load.
      }
    };
    load();
  }, [country, languageVariable]);

  // Handler to update form when Map selection changes
  const handleLocationChange = (location) => {
    if (location) {
      setForm((prev) => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
    }
  };

  // Document upload helpers
  const handleDocFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    // Only images and PDFs are accepted — reject anything else and keep any
    // previously chosen valid file untouched.
    if (file && !isAllowedDocFile(file)) {
      setNewDocFile(null);
      // Reset the input so re-selecting the same rejected file re-fires onChange.
      e.target.value = "";
      setErrors((prev) => ({
        ...prev,
        doc_file: t("Only image or PDF files are allowed"),
      }));
      return;
    }
    setNewDocFile(file);
    if (file) setErrors((prev) => ({ ...prev, doc_file: "" }));
  };

  const handleDocTypeChange = (e) => {
    setNewDocType(e.target.value);
    if (e.target.value) setErrors((prev) => ({ ...prev, doc_type: "" }));
  };

  const docTypeLabel = (val) =>
    VENDOR_DOCUMENT_TYPES.find((d) => d.value === val)?.label || val;

  const uploadDocument = async () => {
    // Inline validation for the add-document sub-form (no toasts).
    const docErrors: Record<string, string> = {};
    if (!newDocType) docErrors.doc_type = t("Please select a document type");
    if (!newDocFile) docErrors.doc_file = t("Please select a file");
    else if (!isAllowedDocFile(newDocFile))
      docErrors.doc_file = t("Only image or PDF files are allowed");
    if (Object.keys(docErrors).length) {
      setErrors((prev) => ({ ...prev, ...docErrors }));
      return;
    }

    setUploadingDoc(true);

    try {
      const presignedRes = await fetchData({
        url: "/shop/uploads/presigned-url",
        method: "POST",
        body: JSON.stringify({
          mime_type: newDocFile.type || "application/octet-stream",
        }),
        reqTitle: REQUESTS_DATA.UPLOAD_MEDIA,
        server: "market",
      });

      if (!presignedRes || !presignedRes.success) {
        showErrorNotification(
          presignedRes?.message || t("Something went wrong"),
        );
        return;
      }

      const uploadUrl =
        presignedRes?.data?.upload_url ||
        presignedRes?.upload_url ||
        presignedRes?.data?.url;

      if (!uploadUrl) {
        showErrorNotification(t("Upload URL not found"));
        return;
      }

      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": newDocFile.type || "application/octet-stream",
        },
        body: newDocFile,
      });

      if (!putResponse.ok) {
        showErrorNotification(t("Failed to upload document"));
        return;
      }

      const uploadedPath =
        presignedRes?.data?.path ||
        presignedRes?.data?.file_path ||
        presignedRes?.data?.key ||
        presignedRes?.path ||
        presignedRes?.file_path ||
        presignedRes?.key ||
        uploadUrl.split("?")[0];

      const doc = {
        type: newDocType,
        path: uploadedPath,
      };

      setForm((prev) => ({ ...prev, documents: [...prev.documents, doc] }));
      setNewDocType("");
      setNewDocFile(null);
      // A document now exists → clear the "at least one document" error.
      setErrors((prev) => ({ ...prev, documents: "" }));
    } catch (err) {
      showErrorNotification(t("Something went wrong"));
    } finally {
      setUploadingDoc(false);
    }
  };

  // A 422's detailed_error can carry code "user_id" for two different account
  // conditions, told apart by the message:
  //  • "…phone is not verified" → the *account's* phone (not any form field)
  //    needs verifying; we recover by verifying + resending.
  //  • "User already exists"    → a request/account already exists; we show the
  //    already-submitted confirmation instead of an error.
  const userIdErrorMessage = (res: any): string => {
    const entry = Array.isArray(res?.detailed_error)
      ? res.detailed_error.find((e: any) => e?.code === "user_id")
      : undefined;
    return entry ? String(entry.message ?? res?.message ?? "") : "";
  };

  const isPhoneUnverifiedError = (res: any) =>
    /not\s+verified/i.test(userIdErrorMessage(res));

  const isUserAlreadyExistsError = (res: any) =>
    /already\s+exists/i.test(userIdErrorMessage(res));

  // Open the global ConfirmMobilePhoneWidget (mounted in NavbarClient, driven by
  // `shouldAuthinticated`; it verifies the user's own phone from `userProfile`)
  // and resolve once verified — mirrors fetchData's waitForReAuthSuccess poll.
  // Resolves false if the widget is cancelled/dismissed or the timeout elapses.
  const openPhoneVerifyAndWait = (): Promise<boolean> => {
    setReAuthResult("pending");
    setShouldAuthinticated(true);
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const state = useAppStore.getState();
        if (state.reAuthResult === "success") {
          clearInterval(interval);
          resolve(true);
        } else if (
          !state.shouldAuthinticated ||
          state.reAuthResult === "cancelled"
        ) {
          clearInterval(interval);
          resolve(false);
        }
      }, 500);
      setTimeout(() => {
        clearInterval(interval);
        resolve(false);
      }, 300000); // 5-minute safety timeout
    });
  };

  // Fire the vendor-request POST and handle the outcome. `allowVerifyRetry`
  // guards the phone-verification recovery so a still-unverified phone after
  // re-verifying surfaces the error instead of re-opening the widget forever.
  const performSubmit = async (allowVerifyRetry = true) => {
    setLoading(true);
    try {
      const res = await fetchData({
        url: "/shop/vendor-requests",
        method: "POST",
        body: JSON.stringify({
          ...form,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        }),
        reqTitle: REQUESTS_DATA.VENDOR_REQUEST,
        server: "market",
        // We own all messaging (success / errors / the verify prompt), so
        // suppress fetchData's own toast — otherwise "This user phone is not
        // verified" would flash alongside the verify widget.
        noMessage: true,
      });

      if (res?.success) {
        showSuccessNotification(t("Request submitted successfully"));
        // Re-read the request so the modal reflects the real server status
        // (normally PENDING) rather than assuming it.
        await fetchVendorRequest();
        return;
      }

      // user_id + "User already exists": a request/account already exists →
      // re-read it so we show its true status (pending/rejected) not an error.
      if (isUserAlreadyExistsError(res)) {
        await fetchVendorRequest();
        return;
      }

      // user_id + "phone is not verified": verify the user's own phone, then
      // resend automatically once verified (no further verify retry → no loop).
      if (allowVerifyRetry && isPhoneUnverifiedError(res)) {
        showErrorNotification(t("Please verify your phone number to continue"));
        const verified = await openPhoneVerifyAndWait();
        if (verified) await performSubmit(false);
        return;
      }

      // Any other failure → surface the backend detail(s).
      if (Array.isArray(res?.detailed_error) && res.detailed_error.length) {
        res.detailed_error.forEach((err: any) =>
          showErrorNotification(err?.message || err),
        );
      } else if (res?.message) {
        showErrorNotification(res.message);
      } else {
        showErrorNotification(t("Something went wrong"));
      }
    } catch (e: any) {
      const err = e || {};
      if (err?.detailed_error && Array.isArray(err.detailed_error)) {
        err.detailed_error.forEach((d: any) =>
          showErrorNotification(d?.message || d),
        );
      } else if (err?.response?.data?.message) {
        showErrorNotification(err.response.data.message);
      } else if (err?.message) {
        showErrorNotification(err.message);
      } else {
        showErrorNotification(t("Something went wrong"));
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    // Every field is validated inline (no toasts): personal, credential, shop
    // and location fields all run through fieldError().
    const validatableFields = [
      "f_name",
      "l_name",
      "email",
      "phone",
      "password",
      "repeat_password",
      "shop_name",
      "shop_address",
      "location_name",
      "location_address",
    ];
    const nextErrors: Record<string, string> = {};
    validatableFields.forEach((name) => {
      const msg = fieldError(name);
      if (msg) nextErrors[name] = msg;
    });

    // At least one document must be uploaded → inline error under the section.
    if (!form.documents || form.documents.length === 0) {
      nextErrors.documents = t("Please upload at least one document");
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    // // Ensure location selected
    // if (!form.latitude || !form.longitude) {
    //   showErrorNotification(t("Please Be Accurate and select your Location"));
    //   return;
    // }

    await performSubmit();
  };

  // A single full-width Close button, reused by every status screen.
  const closeButton = (
    <button
      onClick={onClose}
      className="mt-6 h-[46px] w-full rounded-full bg-[#402CDD] text-[14px] font-semibold text-white hover:bg-[#3422b0] focus:outline-hidden focus:ring-2 focus:ring-[#402CDD]/30 transition-colors"
    >
      {t("Close")}
    </button>
  );

  // Checking the caller's vendor-request status → spinner.
  if (view === "loading") {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/45 animate-fade-in font-sans"
        style={{ zIndex: 999999999 }}
      >
        <div
          className="flex h-[140px] w-[90vw] max-w-[420px] items-center justify-center bg-white rounded-[15px] shadow-[0_3px_10px_rgba(0,0,0,0.1)]"
          role="dialog"
          aria-modal="true"
        >
          <Spinner />
        </div>
      </div>
    );
  }

  // The status lookup failed (network/5xx) → error with a retry.
  if (view === "error") {
    return (
      <StatusScreen
        onClose={onClose}
        cancelLabel={t("Cancel")}
        iconWrapClass="bg-[#f85555]/10 text-[#f85555]"
        icon={<AlertIcon />}
        title={t("Couldn't load your request")}
        body={t(
          "We couldn't load your seller request status. Please try again.",
        )}
        footer={
          <div className="mt-6 flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-[46px] rounded-full bg-[#f2f2f2] text-[14px] font-medium text-[#3c3c3c] hover:bg-[#e9e9e9] focus:outline-hidden focus:ring-2 focus:ring-[#d9d9de] transition-colors"
            >
              {t("Close")}
            </button>
            <button
              onClick={fetchVendorRequest}
              className="flex-1 h-[46px] rounded-full bg-[#402CDD] text-[14px] font-semibold text-white hover:bg-[#3422b0] focus:outline-hidden focus:ring-2 focus:ring-[#402CDD]/30 transition-colors"
            >
              {t("Retry")}
            </button>
          </div>
        }
      />
    );
  }

  // Request under review.
  if (view === "pending") {
    return (
      <StatusScreen
        onClose={onClose}
        cancelLabel={t("Cancel")}
        iconWrapClass="bg-[#402CDD]/10 text-[#402CDD]"
        icon={<ClockIcon />}
        title={t("Your seller request is under review")}
        body={t(
          "We've received your seller request and it's currently being reviewed. We'll let you know once it's processed.",
        )}
        footer={closeButton}
      />
    );
  }

  // Request rejected → show the backend reason when present, else generic copy.
  if (view === "rejected") {
    return (
      <StatusScreen
        onClose={onClose}
        cancelLabel={t("Cancel")}
        iconWrapClass="bg-[#f85555]/10 text-[#f85555]"
        icon={<CrossIcon />}
        title={t("Your seller request was rejected")}
        body={
          rejectionReason ||
          t("Unfortunately, your seller request was not approved.")
        }
        footer={closeButton}
      />
    );
  }

  // Request approved (rare here — approved sellers usually already have a shop).
  if (view === "approved") {
    return (
      <StatusScreen
        onClose={onClose}
        cancelLabel={t("Cancel")}
        iconWrapClass="bg-[#22a06b]/10 text-[#22a06b]"
        icon={<CheckIcon />}
        title={t("Your seller request was approved")}
        body={t(
          "Your seller request has been approved. You can now start selling on Trydos.",
        )}
        footer={closeButton}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/45 animate-fade-in font-sans"
      style={{ zIndex: 999999999 }}
    >
      <div
        className="relative flex flex-col w-[90vw] max-w-[560px] max-h-[90vh] bg-white rounded-[15px] p-6 shadow-[0_3px_10px_rgba(0,0,0,0.1)]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="relative shrink-0 mb-5 w-full">
          <button
            onClick={onClose}
            aria-label={t("Cancel")}
            className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full text-[#929191] hover:bg-[#f2f2f2] hover:text-[#3c3c3c] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <h2 className="text-[16px] font-semibold text-[#3c3c3c] text-center">
            {t("Become A Seller At Trydos")}
          </h2>
          <p className="mt-1 text-center text-[12px] text-[#707070]">
            {t("Tell us about you and your shop to start selling")}
          </p>
        </div>

        {/* Scrollable Form Area */}
        <div className="overflow-y-auto w-full pr-1 mb-5 flex-1 custom-scrollbar">
          <div className="space-y-7">
            {/* Personal Details */}
            <div>
              <SectionHeader>{t("Personal Details")}</SectionHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  name="f_name"
                  label={t("First Name")}
                  value={form.f_name}
                  onChange={onChange}
                  onBlur={handleBlur}
                  error={errors.f_name}
                  placeholder={t("John")}
                />
                <FormInput
                  name="l_name"
                  label={t("Last Name")}
                  value={form.l_name}
                  onChange={onChange}
                  onBlur={handleBlur}
                  error={errors.l_name}
                  placeholder={t("Doe")}
                />
                <FormInput
                  name="email"
                  label={t("Email")}
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  onBlur={handleBlur}
                  error={errors.email}
                  placeholder={t("example@mail.com")}
                />
                <FormInput
                  name="phone"
                  label={t("Phone")}
                  value={form.phone}
                  onChange={onChange}
                  onBlur={handleBlur}
                  error={errors.phone}
                  placeholder={t("+1 234...")}
                />
                <FormInput
                  name="password"
                  label={t("Password")}
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  onBlur={handleBlur}
                  error={errors.password}
                  placeholder="******"
                />
                <FormInput
                  name="repeat_password"
                  label={t("Repeat Password")}
                  type="password"
                  value={form.repeat_password}
                  onChange={onChange}
                  onBlur={handleBlur}
                  error={errors.repeat_password}
                  placeholder="******"
                />
                <CountrySelect
                  name="country_iso"
                  label={t("Country")}
                  value={form.country_iso}
                  onChange={onChange}
                  countries={countries}
                  language={languageVariable}
                />
              </div>
            </div>

            <hr className="border-[#f0f0f0]" />

            {/* Shop Details */}
            <div>
              <SectionHeader>{t("Shop Information")}</SectionHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  name="shop_name"
                  label={t("Shop Name")}
                  value={form.shop_name}
                  onChange={onChange}
                  onBlur={handleBlur}
                  error={errors.shop_name}
                  placeholder={t("My Shop")}
                />
                <FormInput
                  name="shop_address"
                  label={t("Shop Address")}
                  value={form.shop_address}
                  onChange={onChange}
                  onBlur={handleBlur}
                  error={errors.shop_address}
                  placeholder={t("Street 1")}
                />
              </div>
            </div>

            <hr className="border-[#f0f0f0]" />

            {/* Location & Map */}
            <div>
              <SectionHeader>{t("Location Details")}</SectionHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <CountrySelect
                  name="location_country_iso"
                  label={t("Country")}
                  value={form.location_country_iso}
                  onChange={onChange}
                  countries={countries}
                  language={languageVariable}
                />
                <FormInput
                  name="location_name"
                  label={t("Location Name")}
                  value={form.location_name}
                  onChange={onChange}
                  onBlur={handleBlur}
                  error={errors.location_name}
                  placeholder={t("Warehouse")}
                />
                <FormInput
                  name="location_address"
                  label={t("Location Address")}
                  value={form.location_address}
                  onChange={onChange}
                  onBlur={handleBlur}
                  error={errors.location_address}
                  placeholder={t("Full Address")}
                />
              </div>

              {/* Map Component Integration */}
              <div className="w-full rounded-[12px] overflow-hidden border border-[#e6e6e6]">
                <Map
                  expanded={mapExpanded}
                  setExpanded={setMapExpanded}
                  setAddressDetails={(data) => {
                    // Update global store so Map's ConfirmLocation can see the selection
                    setAddressDetails(data);
                    // Also sync local modal form state
                    if (data && data.location)
                      handleLocationChange(data.location);
                  }}
                  center={{
                    lat:
                      form.latitude !== "" &&
                      form.latitude !== null &&
                      form.latitude !== undefined
                        ? Number(form.latitude)
                        : 25.2048,
                    lng:
                      form.longitude !== "" &&
                      form.longitude !== null &&
                      form.longitude !== undefined
                        ? Number(form.longitude)
                        : 55.2708,
                  }}
                />
              </div>
            </div>

            <hr className="border-[#f0f0f0]" />

            {/* Documents Upload */}
            <div>
              <SectionHeader>{t("Documents")}</SectionHeader>

              {errors.documents && (
                <span className="mb-2 block text-[11px] text-[#f85555]">
                  {errors.documents}
                </span>
              )}

              {/* Existing uploaded documents */}
              <div className="flex flex-col gap-2 mb-3">
                {form.documents && form.documents.length > 0 ? (
                  form.documents.map((d, i) => (
                    <div
                      key={i}
                      className="flex w-full items-center justify-between gap-3 bg-[#f8f8f8] rounded-[12px] border border-[#efefef] p-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-[#3c3c3c]">
                          {t(docTypeLabel(d.type))}
                        </div>
                        <div className="text-[11px] text-[#929191] truncate">
                          {d.path}
                        </div>
                      </div>
                      <button
                        className="shrink-0 text-[12px] font-medium text-[#f85555] hover:underline"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            documents: prev.documents.filter(
                              (_, idx) => idx !== i,
                            ),
                          }));
                        }}
                      >
                        {t("Remove")}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="w-full rounded-[12px] border border-dashed border-[#e0e0e0] py-4 text-center text-[12px] text-[#929191]">
                    {t("No documents uploaded")}
                  </div>
                )}
              </div>

              {/* Add new document */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-1 flex flex-col gap-1.5">
                  <FieldLabel htmlFor="doc-type">
                    {t("Document Type")}
                  </FieldLabel>
                  <div className="relative">
                    <select
                      id="doc-type"
                      value={newDocType}
                      onChange={handleDocTypeChange}
                      aria-invalid={errors.doc_type ? true : undefined}
                      className={`${FIELD_CLASS} appearance-none px-3.5 pr-9 cursor-pointer`}
                    >
                      <option value="">{t("Select document type")}</option>
                      {VENDOR_DOCUMENT_TYPES.map((docType) => (
                        <option key={docType.value} value={docType.value}>
                          {t(docType.label)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#929191]" />
                  </div>
                  {errors.doc_type && (
                    <span className="text-[11px] text-[#f85555]">
                      {errors.doc_type}
                    </span>
                  )}
                </div>

                <div className="md:col-span-1 flex flex-col gap-1.5">
                  <FieldLabel htmlFor="doc-upload-btn">{t("File")}</FieldLabel>
                  <button
                    id="doc-upload-btn"
                    className="h-[44px] w-full px-3.5 rounded-[10px] border border-[#e6e6e6] bg-white text-[13px] text-[#3c3c3c] hover:border-[#402CDD] hover:text-[#402CDD] transition-colors truncate"
                    onClick={() => {
                      let Element =
                        document.querySelector<HTMLInputElement>("#doc-upload");
                      Element?.click();
                    }}
                  >
                    {newDocFile?.name || t("Choose File")}
                  </button>
                  <input
                    type="file"
                    id="doc-upload"
                    accept={ACCEPTED_DOC_ACCEPT}
                    onChange={handleDocFileChange}
                    className="hidden"
                  />
                  {errors.doc_file && (
                    <span className="text-[11px] text-[#f85555]">
                      {errors.doc_file}
                    </span>
                  )}
                </div>

                <div className="md:col-span-1">
                  <button
                    className="w-full h-[44px] rounded-[10px] bg-[#402CDD] text-[13px] font-semibold text-white hover:bg-[#3422b0] disabled:bg-[#d9d9de] disabled:cursor-not-allowed transition-colors"
                    onClick={uploadDocument}
                    disabled={uploadingDoc || !newDocFile}
                  >
                    {uploadingDoc ? t("Uploading") : t("Upload Document")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 w-full shrink-0 pt-4 border-t border-[#f0f0f0]">
          <button
            onClick={onClose}
            className="flex-1 h-[46px] rounded-full bg-[#f2f2f2] text-[14px] font-medium text-[#3c3c3c] hover:bg-[#e9e9e9] focus:outline-hidden focus:ring-2 focus:ring-[#d9d9de] transition-colors"
          >
            {t("Cancel")}
          </button>
          <button
            onClick={submit}
            disabled={loading || uploadingDoc || form.documents.length === 0}
            className="flex-1 h-[46px] rounded-full bg-[#402CDD] text-[14px] font-semibold text-white hover:bg-[#3422b0] disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center focus:outline-hidden focus:ring-2 focus:ring-[#402CDD]/30 transition-colors"
          >
            {loading || uploadingDoc ? <Spinner /> : t("Submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
