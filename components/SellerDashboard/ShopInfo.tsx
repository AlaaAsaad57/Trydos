import { ImageCropWidget } from 'components/global/ImageCropWidget';
import React, { useState, useEffect, useRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import { translateFunction } from 'utils/functions';

// --- Types & Interfaces ---
interface ShopInfoProps {
  sellerId: string;
  language: string;
}

interface ShopData {
  shopName: string;
  contact: string;
  address: string;
  image: File | null;
  banner: File | null;
}

interface FormErrors {
  shopName?: string;
  contact?: string;
  address?: string;
}



// --- Mock API Requests ---
const fetchShopData = async (sellerId: string): Promise<ShopData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        shopName: 'Hamdan Shop',
        contact: '123456789',
        address: 'Tartous- Al_Shiekh-badr',
        image: null,
        banner: null,
      });
    }, 1500);
  });
};

const updateShopData = async (sellerId: string, data: ShopData): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000);
  });
};

// --- Main Component ---
export default function ShopInfo({ sellerId, language }: ShopInfoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<ShopData>({
    shopName: '',
    contact: '',
    address: '',
    image: null,
    banner: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  
  // Preview States
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Cropping States
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [croppingType, setCroppingType] = useState<'image' | 'banner' | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Fetch Initial Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchShopData(sellerId);
        setFormData(data);
      } catch (error) {
        console.error("Failed to fetch shop data", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (sellerId) loadData();
  }, [sellerId]);

  // Handle Text Input Changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // 1. Intercept file selection and open the crop widget
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingImageFile(file);
      setCroppingType(type);
    }
    // Reset the input value so the user can select the same file again if they cancel
    e.target.value = ''; 
  };

  // 2. Handle saving the cropped image from the widget
  const handleImageCropSave = (croppedImage: File) => {
    if (!croppingType) return;

    // Set the form data with the new cropped file
    setFormData((prev) => ({ ...prev, [croppingType]: croppedImage }));
    
    // Generate the preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (croppingType === 'image') setImagePreview(reader.result as string);
      if (croppingType === 'banner') setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedImage);

    // Close the widget
    setPendingImageFile(null);
    setCroppingType(null);
  };

  // 3. Handle canceling the crop
  const handleImagePreviewCancel = () => {
    setPendingImageFile(null);
    setCroppingType(null);
  };

  // Vanilla Form Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData.shopName.trim()) {
      newErrors.shopName = translateFunction("Shop Name is required", language);
      isValid = false;
    }
    
    if (!formData.contact.trim()) {
      newErrors.contact = translateFunction("Contact is required", language);
      isValid = false;
    } else if (!/^\d+$/.test(formData.contact.trim())) {
      newErrors.contact = translateFunction("Contact must contain only numbers", language);
      isValid = false;
    }

    if (!formData.address.trim()) {
      newErrors.address = translateFunction("Address is required", language);
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await updateShopData(sellerId, formData);
      alert(translateFunction("Shop Info Updated Successfully!", language));
    } catch (error) {
      alert(translateFunction("Failed to update", language));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-6 flex justify-center items-start relative">
      
      {/* Conditionally Render the Crop Widget */}
      {pendingImageFile && croppingType && (
        <ImageCropWidget
          image={pendingImageFile}
          onSave={handleImageCropSave}
          onClose={handleImagePreviewCancel}
        />
      )}

      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1f1f1f] to-[#5d5d5d] px-6 py-4">
          <h2 className="text-white text-xl font-semibold tracking-wide">
            {translateFunction("Edit Shop Info", language)}
          </h2>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Left Column - Text Inputs */}
            <div className="space-y-6">
              {/* Shop Name */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {translateFunction("Shop Name *", language)}
                </label>
                {isLoading ? (
                  <Skeleton height={45} borderRadius={8} />
                ) : (
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleTextChange}
                    className={`w-full px-4 py-3 rounded-lg bg-[#f0f4fa] border focus:outline-none focus:ring-2 focus:ring-[#5d5d5d] ${
                      errors.shopName ? 'border-red-500' : 'border-transparent'
                    }`}
                  />
                )}
                {errors.shopName && <p className="text-red-500 text-xs mt-1">{errors.shopName}</p>}
              </div>

              {/* Contact */}
              <div>
                <label className=" text-sm text-gray-600 mb-1 flex items-center flex-wrap gap-1">
                  {translateFunction("Contact", language)}
                  <span className="text-red-500 text-xs">
                    ({translateFunction("* Country Code Must Like for AE 971", language)})
                  </span>
                </label>
                {isLoading ? (
                  <Skeleton height={45} borderRadius={8} />
                ) : (
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleTextChange}
                    className={`w-full px-4 py-3 rounded-lg bg-[#f0f4fa] border focus:outline-none focus:ring-2 focus:ring-[#5d5d5d] ${
                      errors.contact ? 'border-red-500' : 'border-transparent'
                    }`}
                  />
                )}
                {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {translateFunction("Address *", language)}
                </label>
                {isLoading ? (
                  <Skeleton height={120} borderRadius={8} />
                ) : (
                  <textarea
                    name="address"
                    rows={4}
                    value={formData.address}
                    onChange={handleTextChange}
                    className={`w-full px-4 py-3 rounded-lg bg-[#f0f4fa] border focus:outline-none focus:ring-2 focus:ring-[#5d5d5d] resize-none ${
                      errors.address ? 'border-red-500' : 'border-transparent'
                    }`}
                  />
                )}
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="flex flex-col space-y-4">
              <label className="block text-sm text-gray-600">
                {translateFunction("Upload Image", language)}
              </label>
              
              {isLoading ? (
                <Skeleton height={45} borderRadius={8} />
              ) : (
                <div className="flex rounded-lg overflow-hidden border border-gray-200">
                  <div className="flex-1 px-4 py-2 bg-white text-gray-400 text-sm flex items-center border-r border-gray-200 truncate">
                    {formData.image?.name || translateFunction("Choose File", language)}
                  </div>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-6 py-2 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    {translateFunction("Browse", language)}
                  </button>
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'image')}
                  />
                </div>
              )}

              {/* Image Preview Box */}
              {isLoading ? (
                <Skeleton height={200} width={200} borderRadius={16} className="mt-4" />
              ) : (
                <div className="w-48 h-48 mt-4 border border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden bg-white">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Shop logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm px-4 text-center">
                      {translateFunction("Preview", language)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Full Width - Banner Upload */}
            <div className="lg:col-span-2 space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <label className="block text-sm text-gray-600">
                  {translateFunction("Upload Banner", language)}
                </label>
                <span className="text-red-500 text-xs">
                  {translateFunction("Ratio .( 6:1 )", language)}
                </span>
              </div>

              {isLoading ? (
                <Skeleton height={45} borderRadius={8} className="w-1/2" />
              ) : (
                <div className="flex rounded-lg overflow-hidden border border-gray-200 w-full lg:w-1/2">
                  <div className="flex-1 px-4 py-2 bg-white text-gray-400 text-sm flex items-center border-r border-gray-200 truncate">
                    {formData.banner?.name || translateFunction("Choose File", language)}
                  </div>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="px-6 py-2 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    {translateFunction("Browse", language)}
                  </button>
                  <input
                    type="file"
                    ref={bannerInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'banner')}
                  />
                </div>
              )}

              {/* Banner Preview Box */}
              {isLoading ? (
                <Skeleton height={200} borderRadius={12} className="w-full mt-4" />
              ) : (
                <div className="w-full h-48 mt-4 border border-[#5d5d5d] rounded-xl flex items-center justify-center overflow-hidden bg-[#5d5d5d]">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-lg font-bold tracking-widest drop-shadow-md">
                      {translateFunction('Preview',language)}
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex justify-between items-center border-t border-gray-100 pt-6">
            {isLoading ? (
              <>
                <Skeleton width={100} height={45} borderRadius={8} />
                <Skeleton width={100} height={45} borderRadius={8} />
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="px-8 py-2.5 bg-[#ff6464] text-white rounded-lg shadow-sm hover:bg-[#ffa3a3] transition-colors font-medium"
                >
                  {translateFunction("Cancel", language)}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-[#5d5d5d] text-white rounded-lg shadow-sm hover:bg-white hover:text-[#5d5d5d]! transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-medium"
                >
                  {isSaving ? "..." : translateFunction("Update", language)}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}