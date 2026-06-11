import { ImageCropWidget } from 'components/global/ImageCropWidget';
import SellerDashboardService from 'services/sellerDashboard';
import React, { useState, useEffect, useRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import { translateFunction } from 'utils/functions';
import { showSuccessMessage } from 'components/global/AddToCartMessage';
import { GetImageUrl } from 'utils/tinyUtils';
import { DashIcon } from 'components/SellerDashboard/ui/icons';
import {
  SectionHeader,
  DashButton,
  DashField,
  Monogram,
} from 'components/SellerDashboard/ui';

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
    <div className="relative">

      {/* Conditionally Render the Crop Widget */}
      {pendingImageFile && croppingType && (
        <ImageCropWidget
          image={pendingImageFile}
          onSave={handleImageCropSave}
          onClose={handleImagePreviewCancel}
        />
      )}

      <SectionHeader
        icon="shopInfo"
        title={translateFunction('Edit Shop Info', language)}
        right={
          !canUpdate ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] semibold bg-[#f4f4f4] text-[#8e8e8e]">
              <DashIcon name="lock" size={13} />
              {translateFunction('Read only', language)}
            </span>
          ) : undefined
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

          {/* Left Column - Text Inputs */}
          <div className="space-y-5">
            {/* Shop Name */}
            <DashField
              label={translateFunction('Shop Name', language)}
              error={errors.shopName}
            >
              {isLoading ? (
                <Skeleton height={48} borderRadius={12} />
              ) : (
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleTextChange}
                  disabled={!canUpdate}
                  placeholder={translateFunction('Shop Name', language)}
                  className={`w-full px-4 h-[48px] rounded-[12px] bg-[#f8f8f8] border text-[14px] text-[#3c3c3c] placeholder:text-[#b8b8b8] outline-none focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    errors.shopName
                      ? 'border-[#f85555]'
                      : 'border-[#ededed] focus:border-[#5d5d5d]'
                  }`}
                />
              )}
            </DashField>

            {/* Contact */}
            <DashField
              label={translateFunction('Contact', language)}
              hint={translateFunction('Country code must lead, e.g. AE = 971', language)}
              error={errors.contact}
            >
              {isLoading ? (
                <Skeleton height={48} borderRadius={12} />
              ) : (
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleTextChange}
                  disabled={!canUpdate}
                  placeholder="971XXXXXXXXX"
                  className={`w-full px-4 h-[48px] rounded-[12px] bg-[#f8f8f8] border text-[14px] text-[#3c3c3c] placeholder:text-[#b8b8b8] outline-none focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    errors.contact
                      ? 'border-[#f85555]'
                      : 'border-[#ededed] focus:border-[#5d5d5d]'
                  }`}
                />
              )}
            </DashField>

            {/* Address */}
            <DashField
              label={translateFunction('Address', language)}
              error={errors.address}
            >
              {isLoading ? (
                <Skeleton height={120} borderRadius={12} />
              ) : (
                <textarea
                  name="address"
                  rows={4}
                  value={formData.address}
                  onChange={handleTextChange}
                  disabled={!canUpdate}
                  placeholder={translateFunction('Address', language)}
                  className={`w-full px-4 py-3 rounded-[12px] bg-[#f8f8f8] border text-[14px] text-[#3c3c3c] placeholder:text-[#b8b8b8] outline-none focus:bg-white resize-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    errors.address
                      ? 'border-[#f85555]'
                      : 'border-[#ededed] focus:border-[#5d5d5d]'
                  }`}
                />
              )}
            </DashField>
          </div>

          {/* Right Column - Logo Upload */}
          <div className="space-y-3">
            <label className="block text-[13px] medium text-[#505050]">
              {translateFunction('Shop Logo', language)}
            </label>
            {isLoading ? (
              <Skeleton height={160} width={160} borderRadius={15} />
            ) : (
              <div className="flex items-start gap-4">
                <div className="w-40 h-40 rounded-[15px] overflow-hidden bg-[#f8f8f8] border border-[#ededed] flex items-center justify-center shrink-0">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt="Shop logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Monogram name={formData.shopName} size={80} rounded={15} />
                  )}
                </div>
                <div className="space-y-2 pt-1">
                  <DashButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon="upload"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!canUpdate}
                  >
                    {imageSrc
                      ? translateFunction('Change', language)
                      : translateFunction('Upload', language)}
                  </DashButton>
                  {imageFileLabel && (
                    <p className="text-[11px] text-[#8e8e8e] max-w-[140px] truncate">
                      {imageFileLabel}
                    </p>
                  )}
                </div>
              </div>
            )}
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'image')}
            />
          </div>

          {/* Full Width - Banner Upload */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <label className="block text-[13px] medium text-[#505050]">
                {translateFunction('Shop Banner', language)}
              </label>
              <span className="text-[11px] text-[#8e8e8e]">
                {translateFunction('Ratio 6:1', language)}
              </span>
            </div>

            {isLoading ? (
              <Skeleton height={120} borderRadius={15} className="w-full" />
            ) : (
              <div className="space-y-3">
                <div className="w-full aspect-[6/1] min-h-[88px] rounded-[15px] overflow-hidden bg-[#f8f8f8] border border-[#ededed] flex items-center justify-center relative">
                  {bannerSrc ? (
                    <img
                      src={bannerSrc}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#c4c2c2]">
                      <DashIcon name="gallery" size={26} strokeWidth={1.4} />
                      <span className="text-[12px]">
                        {translateFunction('No banner yet', language)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <DashButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon="upload"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={!canUpdate}
                  >
                    {bannerSrc
                      ? translateFunction('Change Banner', language)
                      : translateFunction('Upload Banner', language)}
                  </DashButton>
                  {bannerFileLabel && (
                    <p className="text-[11px] text-[#8e8e8e] max-w-[200px] truncate">
                      {bannerFileLabel}
                    </p>
                  )}
                </div>
              </div>
            )}
            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'banner')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {canUpdate && (
          <div className="mt-8 flex justify-end items-center border-t border-[#ededed] pt-6">
            <DashButton type="submit" icon="check" loading={isSaving}>
              {isSaving
                ? translateFunction('Saving...', language)
                : translateFunction('Save Changes', language)}
            </DashButton>
          </div>
        )}
      </form>
    </div>
  );
}
