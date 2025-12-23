import React, { useState, useMemo } from "react";
import { translateFunction } from "utils/functions";
import { getContacts } from "store/chat/actions";
import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";
import { pollinateInput, sanitizePhone } from "@/utils/tinyUtils";
import { REQUESTS_DATA } from "utils/Requests";

// --- Utilities ---

/**
 * Normalizes phone numbers for comparison.
 * Slices the last 10 digits to catch matches between international and local formats.
 */
export const normalizePhoneStrict = (phone: string): string => {
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
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [error, setError] = useState<string>("");

  // Memoized map for UI conflict detection
  const existingNormalizedMap = useMemo(() => {
    const map = new Map<string, string>();
    ContactsData.forEach((c) => {
      const norm = normalizePhoneStrict(c.mobile_phone);
      if (norm) map.set(norm, c.name);
    });
    return map;
  }, [ContactsData]);

  const normalizedNewPhone = normalizePhoneStrict(newContact.phone);
  const conflictingName = existingNormalizedMap.get(normalizedNewPhone);

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
          translateFunction("Contacts API not supported on this browser")
        );
      }

      const rawContacts = await (navigator.contacts as any)?.select(
        ["name", "tel"],
        {
          multiple: true,
        }
      );

      if (!rawContacts || !rawContacts.length) return;

      // Logic: Merge ALL current store data with NEWly selected contacts, then deduplicate
      const combinedList = [...ContactsData, ...rawContacts];
      const finalPayload = deduplicateContacts(combinedList);

      await uploadToServer(finalPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Adds a single manual contact
   */
  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || conflictingName) return;

    try {
      setError("");
      setIsUploading(true);

      const manualEntry = {
        name: newContact.name.trim(),
        mobile_phone: newContact.phone,
      };

      // Merge current store data with the manual entry and deduplicate
      const combinedList = [...ContactsData, manualEntry];
      const finalPayload = deduplicateContacts(combinedList);

      await uploadToServer(finalPayload);

      setNewContact({ name: "", phone: "" });
      setShowAddForm(false);
    } catch (err) {
      setError("Failed to add contact");
    } finally {
      setIsUploading(false);
    }
  };

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
        <div className="w-full p-4 rounded-md bg-white border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">
              {translateFunction("Add a new contact")}
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
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
                value={newContact.name}
                onChange={(e) =>
                  setNewContact({
                    ...newContact,
                    name: pollinateInput(e.target.value),
                  })
                }
                className="w-full p-2 border border-gray-300 text-[#1d1d1d] rounded-md focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Phone Number
              </label>
              <input
                type="tel"
                value={newContact.phone}
                onChange={(e) =>
                  setNewContact({
                    ...newContact,
                    phone: sanitizePhone(e.target.value),
                  })
                }
                className={`w-full p-2 text-[#1d1d1d] border rounded-md outline-none transition-colors ${
                  conflictingName
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-200"
                }`}
                placeholder="+1 234 567 890"
              />
              {conflictingName && (
                <div className="flex items-center gap-1 mt-1 text-orange-600">
                  <span className="text-[10px] bg-orange-200 px-1 rounded">
                    !
                  </span>
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
                !newContact.name ||
                !newContact.phone
              }
              className="w-full p-3 bg-[#8fc3ff] hover:bg-[#7eb2ef] text-white font-bold rounded-md disabled:opacity-50 disabled:bg-gray-200 transition-all"
            >
              {isUploading ? "Adding..." : "Confirm Add"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-2 mt-3 text-red-700 text-center text-xs font-medium">
          {error}
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
