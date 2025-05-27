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
    width: 90,
    height: 90,
    x: 5,
    y: 5,
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

    const canvas = document.createElement("canvas");
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(
      imageRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999999]">
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

        {
          <div className="space-y-4">
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={1}>
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Upload"
                className="max-h-[60vh] object-contain"
              />
            </ReactCrop>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setImageUrl("")}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Change Image
              </button>
              <button
                onClick={getCroppedImg}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  );
}
