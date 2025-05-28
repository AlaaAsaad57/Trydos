import React, { useState } from "react";
import axios from "axios";
import { translateFunction } from "utils/functions";
import { getContacts } from "store/chat/actions";

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleContactSync = async () => {
    try {
      setError("");
      setIsUploading(true);

      // Request permission to access contacts
      if (!("contacts" in navigator && "ContactsManager" in window)) {
        throw new Error("Contacts API not supported in this browser");
      }

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

      // Upload contacts with progress tracking
      alert(JSON.stringify({ contacts: formattedContacts }));
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

  return (
    <button
      onClick={handleContactSync}
      disabled={isUploading}
      className="w-full p-4 flex cursor-pointer rounded-md items-center justify-center gap-3 bg-[#8fc3ff]  transition-colors border-b border-gray-200 relative overflow-hidden"
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
          error ? error : isUploading ? "Syncing contacts..." : "Sync Contacts"
        )}
      </span>

      {isUploading && uploadProgress > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300"
          style={{ width: `${uploadProgress}%` }}
        />
      )}
    </button>
  );
}

export default ChatContactsUpload;
