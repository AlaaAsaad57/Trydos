"use client";

import { useState, useRef } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropWidgetProps {
  onSave: (croppedImage: File) => void;
  onClose: () => void;
  image: File;
}

export function ImageCropWidget({
  onSave,
  onClose,
  image,
}: ImageCropWidgetProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [imageUrl, setImageUrl] = useState<string>(() => {
    const reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    return "";
  });
  const imageRef = useRef<HTMLImageElement>(null);
  const getCroppedImg = () => {
    if (!imageRef.current) return;

    // If no crop is applied or the crop matches the original image dimensions
    if (
      crop.width === 100 &&
      crop.height === 100 &&
      crop.x === 0 &&
      crop.y === 0
    ) {
      onSave(image); // Save the original image directly
      return;
    }

    const canvas = document.createElement("canvas");
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    canvas.width = crop.width ?? imageRef.current.width;
    canvas.height = crop.height ?? imageRef.current.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(
      imageRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      (crop.width ?? imageRef.current.width) * scaleX,
      (crop.height ?? imageRef.current.height) * scaleY,
      0,
      0,
      crop.width ?? imageRef.current.width,
      crop.height ?? imageRef.current.height,
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], image.name, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      onSave(file);
    }, "image/jpeg");
  };

  return (
    <div className="fixed inset-0 bg-[#0000006a] flex items-center justify-center z-99999999">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Crop Image</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <ReactCrop crop={crop} onChange={(c) => setCrop(c)}>
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Upload"
              className="max-h-[50vh] object-contain"
            />
          </ReactCrop>

          <div className="flex justify-end space-x-4">
            {/* <button
              onClick={() => setImageUrl("")}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Change Image
            </button> */}
            <button
              onClick={getCroppedImg}
              className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
