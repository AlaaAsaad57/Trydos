import React, { useState, useMemo } from "react";
import { LogError, translateFunction } from "utils/functions";
import { getContacts } from "store/chat/actions";
import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";
import { pollinateInput, sanitizePhone } from "@/utils/tinyUtils";
import { REQUESTS_DATA } from "utils/Requests";

import { allCountries } from "country-telephone-data";
import { showErrorNotification } from "store/notifications/reducer";
// --- Utilities ---

/**
 * Normalizes phone numbers for comparison.
 * Slices the last 10 digits to catch matches between international and local formats.
 */
const normalizePhoneStrict = (phone: string): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
};

/**
 * Deduplicates a list of contacts.
 * If a number repeats, it keeps the version with the longest name.
 */
const deduplicateContacts = (contacts: any[]) => {
  const uniqueMap = new Map();

  contacts.forEach((c) => {
    // Handle both navigator.contacts format (tel array) and store format (mobile_phone)
    const rawPhone =
      c.mobile_phone || (Array.isArray(c.tel) ? c.tel[0] : c.tel) || "";
    const normalized = normalizePhoneStrict(rawPhone);

    if (!normalized) return;

    const existing = uniqueMap.get(normalized);
    const currentName = (Array.isArray(c.name) ? c.name[0] : c.name) || "";

    // Keep the entry if it's new or if the new name is more descriptive (longer)
    if (!existing || currentName.trim().length > existing.name.length) {
      uniqueMap.set(normalized, {
        name: currentName.trim(),
        mobile_phone: rawPhone.replace(/\s+/g, ""), // Cleaned original for storage
      });
    }
  });

  return Array.from(uniqueMap.values());
};

// --- Component ---

function ChatContactsUpload() {
  const { contacts: ContactsData } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string>("");

  // New State for split phone
  const [manualName, setManualName] = useState("");
  const [dialCode, setDialCode] = useState("+963"); // Default to Syria or your preference
  const [localPhone, setLocalPhone] = useState("");

  const existingNormalizedMap = useMemo(() => {
    const map = new Map<string, string>();
    ContactsData.forEach((c) => {
      const norm = normalizePhoneStrict(c.mobile_phone);
      if (norm) map.set(norm, c.name);
    });
    return map;
  }, [ContactsData]);

  // Combine for validation
  const fullPhoneString = `${dialCode}${localPhone}`;
  const normalizedNewPhone = normalizePhoneStrict(fullPhoneString);
  const conflictingName = existingNormalizedMap.get(normalizedNewPhone);

  const handleAddContact = async () => {
    if (!manualName || !localPhone || conflictingName) return;

    try {
      setError("");
      setIsUploading(true);

      // Use the individual contact endpoint as requested
      await fetchData({
        url: "/api/v1/users/save_contact_v2",
        server: "chat",
        method: "POST",
        body: JSON.stringify({
          name: manualName.trim(),
          mobile_phone: fullPhoneString.replace(/\s+/g, ""), // Cleaned version
        }),
        reqTitle: { reqTitle: "ADD_CONTACTS", code: 999 },
      });

      // Refresh data and reset form
      await getContacts();
      setManualName("");
      setLocalPhone("");
      setShowAddForm(false);
    } catch (err) {
      LogError({
        error: err,
        scenario: "add contact - chat widget",
        name: manualName.trim(),
        mobile_phone: fullPhoneString.replace(/\s+/g, ""),
      });
      setError("Failed to add contact");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Sends the final merged and cleaned list to the server.
   */
  const uploadToServer = async (contactsList: any[]) => {
    let res = await fetchData({
      url: "/api/v1/users/save_contacts",
      server: "chat",
      method: "POST",
      body: JSON.stringify({ contacts: contactsList }),
      reqTitle: REQUESTS_DATA.SAVE_CONTACTS,
    });

    if (!res.success) throw new Error(res.message);
    await getContacts(); // Refresh global store to sync UI
  };

  /**
   * Syncs from Phone Contacts API
   */
  const handleContactSync = async () => {
    if (isUploading) return;
    try {
      setError("");
      setIsUploading(true);

      if (!("contacts" in navigator)) {
        throw new Error(
          translateFunction("Contacts API not supported on this browser"),
        );
      }

      const rawContacts = await (navigator.contacts as any)?.select(
        ["name", "tel"],
        {
          multiple: true,
        },
      );

      if (!rawContacts || !rawContacts.length) return;

      // Logic: Merge ALL current store data with NEWly selected contacts, then deduplicate
      const combinedList = [...ContactsData, ...rawContacts];
      const finalPayload = deduplicateContacts(combinedList);

      await uploadToServer(finalPayload);
    } catch (err) {
      LogError({
        error: err,
        scenario: "sync contact - chat widget",
      });
      showErrorNotification(err?.message);
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Adds a single manual contact
   */

  return (
    <div className="w-full max-w-md mx-auto">
      {!showAddForm ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleContactSync}
            disabled={isUploading}
            className="w-full p-4 flex rounded-md items-center justify-center gap-3 bg-[#8fc3ff] hover:bg-[#7eb2ef] transition-colors disabled:opacity-50"
          >
            <SyncIcon spinning={isUploading} />
            <span className="font-medium">
              {isUploading
                ? "Syncing..."
                : translateFunction("Get from your contacts")}
            </span>
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="w-full p-4 flex rounded-md items-center justify-center gap-3 border-2 border-[#8fc3ff] hover:bg-blue-50 transition-colors text-[#1d1d1d]"
          >
            <PlusIcon />
            <span className="font-medium">
              {translateFunction("Add Contact Manually")}
            </span>
          </button>
        </div>
      ) : (
        <div className="w-full p-4 rounded-md bg-white border border-gray-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Add a new contact</h3>
            <button onClick={() => setShowAddForm(false)}>
              <CloseIcon />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Contact Name
              </label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(pollinateInput(e.target.value))}
                className="w-full p-2 text-[#1d1d1d] border border-gray-300 rounded-md outline-hidden"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Phone Number
              </label>
              <PhoneInput
                dialCode={dialCode}
                phoneNumber={localPhone}
                onDialChange={setDialCode}
                onPhoneChange={(val) => setLocalPhone(sanitizePhone(val))}
                hasConflict={!!conflictingName}
              />

              {conflictingName && (
                <div className="flex items-center gap-1 mt-1 text-orange-600">
                  <p className="text-xs">
                    Already saved as <strong>{conflictingName}</strong>
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleAddContact}
              disabled={
                isUploading ||
                !!conflictingName ||
                !manualName ||
                !localPhone ||
                localPhone.length < 6
              }
              className="w-full p-3 bg-[#8fc3ff] hover:bg-[#7eb2ef] text-white font-bold rounded-md disabled:bg-gray-200"
            >
              {isUploading ? "Adding..." : "Confirm Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Icons ---
const SyncIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    className={`w-5 h-5 ${spinning ? "animate-spin" : ""}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M21 21v-5h-5" />
  </svg>
);
const PlusIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const CloseIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export default ChatContactsUpload;

const PhoneInput = ({
  dialCode,
  phoneNumber,
  onDialChange,
  onPhoneChange,
  hasConflict,
}) => {
  // Find country for the flag
  const activeCountry =
    allCountries.find((c) => c.dialCode === dialCode.replace("+", "")) ||
    allCountries[0];

  return (
    <div className="flex gap-2">
      {/* Dial Code Selector */}
      <div className="relative w-1/3">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          <img
            src={`/icons/flag/${activeCountry.iso2}.svg`}
            alt="flag"
            className="w-5 h-3 object-cover rounded-xs"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
        <select
          value={dialCode}
          onChange={(e) => onDialChange(e.target.value)}
          className="w-full pl-8 p-2 border border-gray-300 rounded-md bg-white text-sm outline-hidden appearance-none text-[#1d1d1d]"
        >
          {allCountries.map((country) => (
            <option
              key={`${country.iso2}-${country.dialCode}`}
              value={`+${country.dialCode}`}
            >
              +{country.dialCode} ({country.name})
            </option>
          ))}
        </select>
      </div>

      {/* Local Number Input */}
      <input
        type="tel"
        value={phoneNumber}
        onChange={(e) => onPhoneChange(e.target.value)}
        className={`flex-1 p-2 border rounded-md outline-hidden text-[#1d1d1d] transition-colors ${
          hasConflict
            ? "border-orange-400 bg-orange-50"
            : "border-gray-300 focus:ring-2 focus:ring-blue-200"
        }`}
        placeholder="123 4567"
      />
    </div>
  );
};
