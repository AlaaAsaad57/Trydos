import React, { useState } from "react";
import axios from "axios";
import { translateFunction } from "utils/functions";
import { getContacts } from "store/chat/actions";
import { useAppStore } from "store";

declare global {
  interface Navigator {
    contacts?: {
      select(
        properties: string[],
        opts?: { multiple?: boolean }
      ): Promise<any[]>;
    };
  }
  interface Permissions {
    query(permissionDesc: { name: "contacts" }): Promise<PermissionStatus>;
  }
}

function ChatContactsUpload() {
  const { contacts: ContactsData } = useAppStore();
  const getContactsData = async () => {
    await getContacts();
  };
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [isPhoneDuplicate, setIsPhoneDuplicate] = useState(false);

  const handleContactSync = async () => {
    try {
      setError("");
      setIsUploading(true);

      // Request permission to access contacts
      if (!("contacts" in navigator && "ContactsManager" in window)) {
        throw new Error("Contacts API not supported in this browser");
      }
      await getContactsData();
      // @ts-ignore - The Contacts API types aren't in the standard lib yet

      // @ts-ignore - The Contacts API types aren't in the standard lib yet
      const contacts = await navigator.contacts.select(["name", "tel"], {
        multiple: true,
      });

      if (!contacts.length) {
        throw new Error("No contacts selected");
      }

      const formattedContacts = contacts.map((contact) => ({
        name: contact.name[0],
        mobile_phone: contact.tel[0] || [],
      }));
      let map = new Map();
      [...ContactsData, ...formattedContacts].map((contact) => {
        map.set(contact.mobile_phone, contact.name);
      });
      // Upload contacts with progress tracking
      let res = await axios.post(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          "/api/v1/users/save_contacts",
        { contacts: formattedContacts },
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(progress);
          },
          headers: {
            Authorization: `Bearer ${
              JSON.parse(localStorage.getItem("USER-CHAT") || "{}")
                ?.access_token
            }`,
          },
        }
      );
      await getContacts();
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync contacts");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddContact = async () => {
    try {
      if (!newContact.name || !newContact.phone) {
        setError("Name and phone are required");
        return;
      }

      setError("");
      setIsUploading(true);

      // Normalize phone number for comparison
      const normalizedPhone = normalizePhoneNumber(newContact.phone);

      // Check if phone already exists in contacts
      const isDuplicate = ContactsData.some(
        (contact) =>
          normalizePhoneNumber(contact.mobile_phone) === normalizedPhone
      );

      if (isDuplicate) {
        setIsPhoneDuplicate(true);
        setError("This phone number already exists in your contacts");
        setIsUploading(false);
        return;
      }

      const formattedContact = [
        {
          name: newContact.name,
          mobile_phone: newContact.phone,
        },
      ];

      // Upload contact with progress tracking
      await axios.post(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          "/api/v1/users/save_contacts",
        { contacts: [...formattedContact] },
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(progress);
          },
          headers: {
            Authorization: `Bearer ${
              JSON.parse(localStorage.getItem("USER-CHAT") || "{}")
                ?.access_token
            }`,
          },
        }
      );

      await getContacts();
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
        setNewContact({ name: "", phone: "" });
        setShowAddForm(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add contact");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setNewContact({ ...newContact, phone });

    // Normalize phone number for comparison
    const normalizedPhone = normalizePhoneNumber(phone);

    // Check if phone already exists in contacts
    const isDuplicate = ContactsData.some(
      (contact) =>
        normalizePhoneNumber(contact.mobile_phone) === normalizedPhone
    );

    setIsPhoneDuplicate(isDuplicate);
    if (isDuplicate) {
      setError("This phone number already exists in your contacts");
    } else {
      setError("");
    }
  };

  // Helper function to normalize phone numbers for comparison
  const normalizePhoneNumber = (phone: string): string => {
    // Remove all non-digit characters except the leading +
    let normalized = phone.trim();

    // If the number starts with +, remove it temporarily
    const hasPlus = normalized.startsWith("+");
    if (hasPlus) {
      normalized = normalized.substring(1);
    }

    // Remove all non-digit characters
    normalized = normalized.replace(/\D/g, "");

    // Add back the + if it was there originally
    if (hasPlus) {
      normalized = "+" + normalized;
    }

    return normalized;
  };

  return (
    <div className="w-full">
      {!showAddForm ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleContactSync}
            disabled={isUploading}
            className="w-full p-4 flex cursor-pointer rounded-md items-center justify-center gap-3 bg-[#8fc3ff] transition-colors border-b border-gray-200 relative overflow-hidden"
          >
            <svg
              className={`w-5 h-5 ${isUploading ? "animate-spin" : ""}`}
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

            <span className="font-medium">
              {translateFunction(
                error
                  ? error
                  : isUploading
                  ? "Syncing contacts..."
                  : "Get from your contacts"
              )}
            </span>

            {isUploading && uploadProgress > 0 && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            )}
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="w-full p-4 flex cursor-pointer   bg-[#8fc3ff] rounded-md items-center justify-center gap-3  hover:bg-gray-200 transition-colors border-b border-gray-200"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="font-medium text-[#1d1d1d]">
              {translateFunction("Add contacts")}
            </span>
          </button>
        </div>
      ) : (
        <div className="w-full p-4 rounded-md bg-gray-50 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">
              {translateFunction("Add a new contact")}
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setError("");
                setNewContact({ name: "", phone: "" });
                setIsPhoneDuplicate(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translateFunction("Name")}
              </label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
                className="w-full text-[#1d1d1d] p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={translateFunction("Enter name")}
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translateFunction("Phone")}
              </label>
              <input
                type="tel"
                value={newContact.phone}
                onChange={handlePhoneChange}
                className={`w-full text-[#1d1d1d] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isPhoneDuplicate ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={translateFunction("Enter phone number")}
                disabled={isUploading}
              />
              {isPhoneDuplicate && (
                <p className="text-red-500 text-xs mt-1">
                  {translateFunction(
                    "This phone number already exists in your contacts"
                  )}
                </p>
              )}
            </div>

            <button
              onClick={handleAddContact}
              disabled={
                isUploading ||
                isPhoneDuplicate ||
                !newContact.name ||
                !newContact.phone
              }
              className="w-full p-3 flex cursor-pointer rounded-md items-center justify-center gap-3 bg-[#8fc3ff] transition-colors relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}

              <span className="font-medium">
                {translateFunction(
                  isUploading ? "Adding contact..." : "Add contact"
                )}
              </span>

              {isUploading && uploadProgress > 0 && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              )}
            </button>

            {error && !isPhoneDuplicate && (
              <p className="text-red-500 text-sm mt-1">
                {translateFunction(error)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatContactsUpload;
