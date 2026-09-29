import { useState, useMemo } from "react";
import { LogError, translateFunction } from "utils/functions";
import { getContacts } from "store/chat/actions";
import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";
import { pollinateInput, sanitizePhone } from "@/utils/tinyUtils";
import { REQUESTS_DATA } from "utils/Requests";
import { allCountries } from "country-telephone-data";
import { showErrorNotification } from "store/notifications/reducer";
import { getLocalizedCountryName } from "utils/countryData";
import {
  canonicalPhone,
  phoneRegion,
  phoneWithDialCode,
  type PhoneRegion,
} from "components/Chat/contactPhone";
// --- Utilities ---

/**
 * Merges the saved contacts with the ones picked from the phone, one entry
 * per number. Numbers are compared in their full international form, so the
 * phone book's "0937288307" is the saved "963937288307".
 *
 * - A saved contact keeps its saved number, so the backend sees the same record.
 * - A saved contact keeps its saved name: the import never renames it. A
 *   picked name fills a saved contact only when it has no name.
 * - Among picks for one new number, the longest name wins.
 * - A new number is sent in its full form, and every number of a picked
 *   contact is imported, not only the first.
 */
const mergeContacts = (saved: any[], picked: any[], region: PhoneRegion) => {
  const byPhone = new Map<string, { name: string; mobile_phone: string }>();
  // Numbers whose name came from the phone book, not from a saved contact.
  const namedByPick = new Set<string>();

  saved.forEach((c) => {
    const key = canonicalPhone(c.mobile_phone, region);
    if (!key || byPhone.has(key)) return;
    byPhone.set(key, {
      name: String(c.name ?? "").trim(),
      mobile_phone: String(c.mobile_phone).replace(/\s+/g, ""),
    });
  });

  picked.forEach((c) => {
    const name = String((Array.isArray(c.name) ? c.name[0] : c.name) ?? "").trim();
    const tels = Array.isArray(c.tel) ? c.tel : [c.tel];
    tels.forEach((tel: string) => {
      const key = canonicalPhone(tel, region);
      if (!key) return;
      const entry = byPhone.get(key);
      if (!entry) {
        byPhone.set(key, { name, mobile_phone: key });
        namedByPick.add(key);
      } else if (
        !entry.name ||
        (namedByPick.has(key) && name.length > entry.name.length)
      ) {
        entry.name = name;
        namedByPick.add(key);
      }
    });
  });

  return Array.from(byPhone.values());
};

// --- Component ---

function ChatContactsUpload() {
  const { contacts: ContactsData, userChat, user, country } = useAppStore();
  const region = phoneRegion(userChat?.mobile_phone ?? user?.phone, country);
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
      const norm = canonicalPhone(c.mobile_phone, region);
      if (norm) map.set(norm, c.contact_user?.name || c.name);
    });
    return map;
  }, [ContactsData, region]);

  // Combine for validation
  const fullPhoneString = phoneWithDialCode(dialCode, localPhone);
  const conflictingName = existingNormalizedMap.get(fullPhoneString);

  const handleAddContact = async () => {
    if (!manualName || !localPhone || conflictingName) return;

    try {
      setError("");
      setIsUploading(true);

      // Use the individual contact endpoint as requested
      const res = await fetchData({
        url: "/api/v1/users/save_contact_v2",
        server: "chat",
        method: "POST",
        body: JSON.stringify({
          name: manualName.trim(),
          mobile_phone: fullPhoneString,
        }),
        reqTitle: { reqTitle: "ADD_CONTACTS", code: 999 },
      });
      if (!res?.success) throw new Error(res?.message);

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
        mobile_phone: fullPhoneString,
      });
      setError("Failed to add contact");
      showErrorNotification(translateFunction("Failed to add contact"));
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

      // Logic: Merge ALL current store data with NEWly selected contacts, one entry per number
      const finalPayload = mergeContacts(ContactsData, rawContacts, region);

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
                ? translateFunction("Syncing...")
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
            <h3 className="font-semibold text-gray-700">{translateFunction("Add a new contact")}</h3>
            <button onClick={() => setShowAddForm(false)}>
              <CloseIcon />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                {translateFunction("Contact Name")}
              </label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(pollinateInput(e.target.value))}
                className="w-full p-2 text-[#1d1d1d] border border-gray-300 rounded-md outline-hidden"
                placeholder={translateFunction("Enter Full Name")}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                {translateFunction("Phone Number")}
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
                    {translateFunction("Already saved as")} <strong>{conflictingName}</strong>
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
              {isUploading ? translateFunction("Adding...") : translateFunction("Confirm Add")}
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

  const {language}=useAppStore();
  
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
              +{country.dialCode} ({getLocalizedCountryName(country.iso2,language)})
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
