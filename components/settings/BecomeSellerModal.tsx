"use client";
import { useState } from "react";
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

// Reusable Input Component
const FormInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}) => (
  <div className="flex flex-col gap-1 w-full">
    <label htmlFor={name} className="text-[13px] text-gray-700 font-medium">
      {label}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      className="
        w-full h-[40px] px-3 
        rounded border border-gray-300 
        text-[13px] text-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
      "
    />
  </div>
);

export default function BecomeSellerModal({ onClose }) {
  const { lang } = useParams();
  // @ts-ignore
  const languageVariable = lang?.split("-")[1];
  const t = (key: string) => translateFunction(key, languageVariable);

  const [loading, setLoading] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);

  const { setAddressDetails } = useAppStore();

  const [form, setForm] = useState({
    f_name: "",
    l_name: "",
    email: "",
    phone: "",
    password: "",
    repeat_password: "",
    currency_code: "USD",
    country_iso: "ARE",
    language_code: "en",
    shop_name: "",
    shop_address: "",
    location_country_iso: "ARE",
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

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
    setNewDocFile(file);
  };

  const uploadDocument = async () => {
    if (!newDocFile) {
      showErrorNotification(t("Please select a file"));
      return;
    }
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      // server expects 'image' key in other uploads; keep same
      formData.append("image", newDocFile);
      formData.append("path", "vendor_documents/");

      const res = await fetchData({
        url: "/storage/storage-upload",
        method: "POST",
        body: formData,
        reqTitle: REQUESTS_DATA.UPLOAD_CLOUDINARY,
        server: "market",
      });

      if (!res || !res.success) {
        showErrorNotification(res?.message || t("Something went wrong"));
      } else {
        const sub = res.data?.sub_path || res.data?.path || res.data;
        const doc = {
          type: newDocType || newDocFile.name,
          path: sub,
        };
        setForm((prev) => ({ ...prev, documents: [...prev.documents, doc] }));
        setNewDocType("");
        setNewDocFile(null);
      }
    } catch (err) {
      showErrorNotification(t("Something went wrong"));
    } finally {
      setUploadingDoc(false);
    }
  };

  const submit = async () => {
    // Basic validations
    if (
      !form.f_name ||
      !form.l_name ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.repeat_password ||
      !form.shop_name ||
      !form.shop_address
    ) {
      showErrorNotification(t("Please fill in all fields"));
      return;
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(form.email)) {
      showErrorNotification(t("Enter Email"));
      return;
    }

    if (form.password !== form.repeat_password) {
      showErrorNotification(t("Passwords do not match"));
      return;
    }

    // // Ensure location selected
    // if (!form.latitude || !form.longitude) {
    //   showErrorNotification(t("Please Be Accurate and select your Location"));
    //   return;
    // }

    // Ensure at least one document uploaded
    if (!form.documents || form.documents.length === 0) {
      showErrorNotification(t("Please upload at least one document"));
      return;
    }

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
      });

      if (!res || !res.success) {
        // If validation details provided by backend, show them
        if (res?.detailed_error && Array.isArray(res.detailed_error)) {
          res.detailed_error.forEach((err) => {
            showErrorNotification(err?.message || err);
          });
        } else if (res?.message) {
          showErrorNotification(res.message);
        } else {
          showErrorNotification(t("Something went wrong"));
        }
      } else {
        showSuccessNotification(t("Request submitted successfully"));
        onClose();
      }
    } catch (e) {
      const err = e || {};
      // If backend returned validation errors in thrown error
      if (err?.detailed_error && Array.isArray(err.detailed_error)) {
        err.detailed_error.forEach((d) =>
          showErrorNotification(d?.message || d)
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

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 "
      style={{ zIndex: 999999999 }}
    >
      <div
        className="fixed w-[340px] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-8 flex flex-col w-[90vw] max-w-[650px] max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-lg font-semibold mb-6 text-gray-900 text-center shrink-0">
          {t("Become A Seller At Trydos")}
        </h2>

        {/* Scrollable Form Area */}
        <div className="overflow-y-auto w-full p-2 mb-6 flex-1 custom-scrollbar">
          <div className="space-y-6">
            {/* Personal Details */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-gray-400 uppercase tracking-wider text-center">
                {t("Personal Details")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  name="f_name"
                  label={t("First Name")}
                  value={form.f_name}
                  onChange={onChange}
                  placeholder={t("John")}
                />
                <FormInput
                  name="l_name"
                  label={t("Last Name")}
                  value={form.l_name}
                  onChange={onChange}
                  placeholder={t("Doe")}
                />
                <FormInput
                  name="email"
                  label={t("Email")}
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder={t("example@mail.com")}
                />
                <FormInput
                  name="phone"
                  label={t("Phone")}
                  value={form.phone}
                  onChange={onChange}
                  placeholder={t("+1 234...")}
                />
                <FormInput
                  name="password"
                  label={t("Password")}
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="******"
                />
                <FormInput
                  name="repeat_password"
                  label={t("Repeat Password")}
                  type="password"
                  value={form.repeat_password}
                  onChange={onChange}
                  placeholder="******"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Shop Details */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-gray-400 uppercase tracking-wider text-center">
                {t("Shop Information")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  name="shop_name"
                  label={t("Shop Name")}
                  value={form.shop_name}
                  onChange={onChange}
                  placeholder={t("My Shop")}
                />
                <FormInput
                  name="shop_address"
                  label={t("Shop Address")}
                  value={form.shop_address}
                  onChange={onChange}
                  placeholder={t("Street 1")}
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Location & Map */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-gray-400 uppercase tracking-wider text-center">
                {t("Location Details")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormInput
                  name="location_name"
                  label={t("Location Name")}
                  value={form.location_name}
                  onChange={onChange}
                  placeholder={t("Warehouse")}
                />
                <FormInput
                  name="location_address"
                  label={t("Location Address")}
                  value={form.location_address}
                  onChange={onChange}
                  placeholder={t("Full Address")}
                />
              </div>

              {/* Map Component Integration */}
              <div className="w-full rounded-lg overflow-hidden">
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

              {/* Documents Upload */}
              <div className="pt-4">
                <h3 className="mb-3 text-sm font-bold text-gray-400 uppercase tracking-wider text-center">
                  {t("Documents")}
                </h3>

                {/* Existing uploaded documents */}
                <div className="flex flex-col gap-2 mb-3">
                  {form.documents && form.documents.length > 0 ? (
                    form.documents.map((d, i) => (
                      <div
                        key={i}
                        className="flex-row items-center justify-between bg-[#F8F8F8] rounded-[8px] p-2"
                      >
                        <div className="text-[13px] text-gray-800">
                          <strong>{d.type}</strong>
                          <div className="text-[12px] text-gray-600">
                            {d.path}
                          </div>
                        </div>
                        <div>
                          <button
                            className="text-red-500 text-sm"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                documents: prev.documents.filter(
                                  (_, idx) => idx !== i
                                ),
                              }));
                            }}
                          >
                            {t("Remove")}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      {t("No documents uploaded")}
                    </div>
                  )}
                </div>

                {/* Add new document */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                  <div className="col-span-1">
                    <label className="text-[13px] text-gray-700 font-medium">
                      {t("Document Type")}
                    </label>
                    <input
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value)}
                      className="w-full h-[40px] px-3 rounded border border-gray-300 text-[13px]"
                      placeholder={t("e.g., Trade License")}
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[13px] text-gray-700 font-medium">
                      {t("Choose File")}
                    </label>
                    <input
                      type="file"
                      onChange={handleDocFileChange}
                      className="w-full"
                    />
                  </div>

                  <div className="col-span-1">
                    <button
                      className="w-full px-3 py-2 rounded bg-[#346BFF] text-white hover:bg-blue-600"
                      onClick={uploadDocument}
                      disabled={uploadingDoc}
                    >
                      {uploadingDoc ? t("Uploading") : t("Upload Document")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 w-full justify-center shrink-0 min-h-[40px]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            {t("Cancel")}
          </button>
          <button
            onClick={submit}
            disabled={loading || uploadingDoc}
            className="px-4 py-2 rounded bg-[#346BFF] text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[100px] flex justify-center items-center transition-colors"
          >
            {loading || uploadingDoc ? <Spinner /> : t("Submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
