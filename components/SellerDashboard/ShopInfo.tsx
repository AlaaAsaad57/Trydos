import { ImageCropWidget } from 'components/global/ImageCropWidget';
import SellerDashboardService from 'services/sellerDashboard';
import React, { useState, useEffect, useRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import { translateFunction } from 'utils/functions';
import { showSuccessMessage } from 'components/global/AddToCartMessage';
import { GetImageUrl } from 'utils/tinyUtils';

// --- Types & Interfaces ---
interface ShopInfoProps {
  sellerId: string;
  language: string;
  // UPDATE_SHOP_INFO permission — when false the form is read-only.
  canUpdate?: boolean;
}

interface ShopFormData {
  shopName: string;
  contact: string;
  address: string;
}

interface FormErrors {
  shopName?: string;
  contact?: string;
  address?: string;
}

// --- Main Component ---
export default function ShopInfo({ sellerId, language, canUpdate = false }: ShopInfoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<ShopFormData>({
    shopName: '',
    contact: '',
    address: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // New files picked by the user (null = keep the existing media)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Existing media URLs returned by GET /shop/info
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  // Local preview (data URL) for a freshly cropped file
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Cropping States
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [croppingType, setCroppingType] = useState<'image' | 'banner' | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Fetch Initial Data — GET /shop/info (READ_SHOP_INFO)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await SellerDashboardService.getShopInfo(sellerId);
        const data = res?.data ?? res ?? {};
        setFormData({
          shopName: data.name ?? '',
          contact: data.contact ?? '',
          address: data.address ?? '',
        });
        setImageUrl(GetImageUrl(data.image) ?? null);
        setBannerUrl(GetImageUrl(data.banner) ?? null);
      } catch (error) {
        console.error('Failed to fetch shop data', error);
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

    if (croppingType === 'image') setImageFile(croppedImage);
    if (croppingType === 'banner') setBannerFile(croppedImage);

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
      newErrors.shopName = translateFunction('Shop Name is required', language);
      isValid = false;
    }

    if (!formData.contact.trim()) {
      newErrors.contact = translateFunction('Contact is required', language);
      isValid = false;
    } else if (!/^\+?\d+$/.test(formData.contact.trim())) {
      newErrors.contact = translateFunction('Contact must contain valid numbers', language);
      isValid = false;
    }


    if (!formData.address.trim()) {
      newErrors.address = translateFunction('Address is required', language);
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };
  const normializeImage=(image:string)=>{
    if(!image) return null
    let newImage=image?.split('/');
    let normalizedStr=newImage?.[newImage.length-1];
    return normalizedStr;
  }

  const normalizedWithImageUpload=(image:string)=>{
    if(!image) return null;
    if(image.includes('image/upload')){
      return GetImageUrl(image.split('/image/upload')[1]);
    }
    else{
      return GetImageUrl(image);
    }
  }
  // Submit Handler — uploads any new media then PUT /shop/info (UPDATE_SHOP_INFO)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) return;
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Upload only the media that changed; otherwise keep the existing URL.
      let finalImage = imageUrl;
      let finalBanner = bannerUrl;

      if (imageFile) {
        finalImage = await SellerDashboardService.uploadShopImage(imageFile, 'seller');
        finalImage=normalizedWithImageUpload(finalImage);
      }
      if (bannerFile) {
        finalBanner = await SellerDashboardService.uploadShopImage(bannerFile, 'seller');
        finalBanner=normalizedWithImageUpload(finalBanner);
      }

      const res = await SellerDashboardService.updateShopInfo(sellerId, {
        name: formData.shopName.trim(),
        address: formData.address.trim(),
        contact: formData.contact.trim(),
        image: normializeImage(finalImage),
        banner: normializeImage(finalBanner),
      });

      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to update');
      }

      // Persist the new URLs and clear the staged files
      setImageUrl(finalImage);
      setBannerUrl(finalBanner);
      setImageFile(null);
      setBannerFile(null);
      setImagePreview(null);
      setBannerPreview(null);

      showSuccessMessage(translateFunction('Shop Info Updated Successfully!', language));
    } catch (error) {
      console.error('Failed to update shop info', error);
      alert(translateFunction('Failed to update', language));
    } finally {
      setIsSaving(false);
    }
  };

  // Preview sources: a freshly cropped file takes priority over the stored URL.
  const imageSrc = imagePreview || (imageUrl);
  const bannerSrc = bannerPreview || (bannerUrl);
  const imageFileLabel = imageFile?.name || (imageUrl ? imageUrl.split('/').pop() : '');
  const bannerFileLabel = bannerFile?.name || (bannerUrl ? bannerUrl.split('/').pop() : '');

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
            {translateFunction('Edit Shop Info', language)}
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
                  {translateFunction('Shop Name *', language)}
                </label>
                {isLoading ? (
                  <Skeleton height={45} borderRadius={8} />
                ) : (
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleTextChange}
                    disabled={!canUpdate}
                    className={`w-full px-4 py-3 rounded-lg bg-[#f0f4fa] border focus:outline-none focus:ring-2 focus:ring-[#5d5d5d] disabled:opacity-60 disabled:cursor-not-allowed ${
                      errors.shopName ? 'border-red-500' : 'border-transparent'
                    }`}
                  />
                )}
                {errors.shopName && <p className="text-red-500 text-xs mt-1">{errors.shopName}</p>}
              </div>

              {/* Contact */}
              <div>
                <label className=" text-sm text-gray-600 mb-1 flex items-center flex-wrap gap-1">
                  {translateFunction('Contact', language)}
                  <span className="text-red-500 text-xs">
                    ({translateFunction('* Country Code Must Like for AE 971', language)})
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
                    disabled={!canUpdate}
                    className={`w-full px-4 py-3 rounded-lg bg-[#f0f4fa] border focus:outline-none focus:ring-2 focus:ring-[#5d5d5d] disabled:opacity-60 disabled:cursor-not-allowed ${
                      errors.contact ? 'border-red-500' : 'border-transparent'
                    }`}
                  />
                )}
                {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {translateFunction('Address *', language)}
                </label>
                {isLoading ? (
                  <Skeleton height={120} borderRadius={8} />
                ) : (
                  <textarea
                    name="address"
                    rows={4}
                    value={formData.address}
                    onChange={handleTextChange}
                    disabled={!canUpdate}
                    className={`w-full px-4 py-3 rounded-lg bg-[#f0f4fa] border focus:outline-none focus:ring-2 focus:ring-[#5d5d5d] resize-none disabled:opacity-60 disabled:cursor-not-allowed ${
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
                {translateFunction('Upload Image', language)}
              </label>

              {isLoading ? (
                <Skeleton height={45} borderRadius={8} />
              ) : (
                <div className="flex rounded-lg overflow-hidden border border-gray-200">
                  <div className="flex-1 px-4 py-2 bg-white text-gray-400 text-sm flex items-center border-r border-gray-200 truncate">
                    {imageFileLabel || translateFunction('Choose File', language)}
                  </div>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!canUpdate}
                    className="px-6 py-2 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {translateFunction('Browse', language)}
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
                <div className="w-48 h-48 mt-4 border border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden bg-white relative">
                  {/* {imageSrc&&<span className='absolute z-10 top-1 right-1 rounded-full p-1 h-[30px] w-[30px] flex items-center justify-center bg-red-500 cursor-pointer' onClick={()=>{
                    setImageFile(null);
                    setImagePreview(null);
                    setImageUrl(null);
                  }}>
                    <img src={'/icons/DeleteIcon.svg'} width={15} height={15}/>
                    </span>} */}
                  {imageSrc ? (
                    <img src={imageSrc} alt="Shop logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm px-4 text-center">
                      {translateFunction('Preview', language)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Full Width - Banner Upload */}
            <div className="lg:col-span-2 space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <label className="block text-sm text-gray-600">
                  {translateFunction('Upload Banner', language)}
                </label>
                <span className="text-red-500 text-xs">
                  {translateFunction('Ratio .( 6:1 )', language)}
                </span>
              </div>

              {isLoading ? (
                <Skeleton height={45} borderRadius={8} className="w-1/2" />
              ) : (
                <div className="flex rounded-lg overflow-hidden border border-gray-200 w-full lg:w-1/2">
                  <div className="flex-1 px-4 py-2 bg-white text-gray-400 text-sm flex items-center border-r border-gray-200 truncate">
                    {bannerFileLabel || translateFunction('Choose File', language)}
                  </div>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={!canUpdate}
                    className="px-6 py-2 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {translateFunction('Browse', language)}
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
                <div className="w-full h-48 mt-4 border border-[#5d5d5d] rounded-xl flex items-center justify-center overflow-hidden bg-[#5d5d5d] relative">
                   {/* {bannerSrc && <span className='absolute z-10 top-1 right-1 rounded-full p-1 h-[30px] w-[30px] flex items-center justify-center bg-red-500 cursor-pointer' onClick={()=>{
                    setBannerFile(null);
                    setBannerPreview(null);
                    setBannerUrl(null);
                   }}>
                    <img src={'/icons/DeleteIcon.svg'} width={15} height={15}/>
                    </span>} */}
                  {bannerSrc ? (
                    <img src={bannerSrc} alt="Banner preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-lg font-bold tracking-widest drop-shadow-md">
                      {translateFunction('Preview', language)}
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
                  {translateFunction('Cancel', language)}
                </button>
                {canUpdate && (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-2.5 bg-[#5d5d5d] text-white rounded-lg shadow-sm hover:bg-white hover:text-[#5d5d5d]! transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-medium"
                  >
                    {isSaving ? '...' : translateFunction('Update', language)}
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
