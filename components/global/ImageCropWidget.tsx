"use client";

import { useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import { createPortal } from "react-dom";
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
  const [isRotated, setIsRotated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const rotate = (direction: 1 | -1) => {
    if (!imageRef.current) return;

    const sourceImage = imageRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = sourceImage.naturalHeight;
    canvas.height = sourceImage.naturalWidth;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((Math.PI / 2) * direction);
    context.drawImage(
      sourceImage,
      -sourceImage.naturalWidth / 2,
      -sourceImage.naturalHeight / 2,
      sourceImage.naturalWidth,
      sourceImage.naturalHeight,
    );

    setImageUrl(canvas.toDataURL("image/jpeg", 0.95));
    setCrop({
      unit: "%",
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    });
    setIsRotated(true);
  };

  const getCroppedImg = () => {
    if (!imageRef.current) return;

    // If no crop is applied or the crop matches the original image dimensions
    if (
      !isRotated &&
      crop.width === 100 &&
      crop.height === 100 &&
      crop.x === 0 &&
      crop.y === 0
    ) {
      onSave(image);
      return;
    }

    const canvas = document.createElement("canvas");
    const renderedWidth = imageRef.current.width;
    const renderedHeight = imageRef.current.height;
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    const scaleX = naturalWidth / renderedWidth;
    const scaleY = naturalHeight / renderedHeight;

    const renderedCropWidth =
      crop.unit === "%"
        ? ((crop.width ?? 100) / 100) * renderedWidth
        : (crop.width ?? renderedWidth);
    const renderedCropHeight =
      crop.unit === "%"
        ? ((crop.height ?? 100) / 100) * renderedHeight
        : (crop.height ?? renderedHeight);
    const renderedCropX =
      crop.unit === "%"
        ? ((crop.x ?? 0) / 100) * renderedWidth
        : (crop.x ?? 0);
    const renderedCropY =
      crop.unit === "%"
        ? ((crop.y ?? 0) / 100) * renderedHeight
        : (crop.y ?? 0);

    const sourceX = Math.max(0, Math.floor(renderedCropX * scaleX));
    const sourceY = Math.max(0, Math.floor(renderedCropY * scaleY));
    const sourceWidth = Math.min(
      naturalWidth - sourceX,
      Math.max(1, Math.floor(renderedCropWidth * scaleX)),
    );
    const sourceHeight = Math.min(
      naturalHeight - sourceY,
      Math.max(1, Math.floor(renderedCropHeight * scaleY)),
    );

    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(
      imageRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight,
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

  const content = (
    <div
      className="fixed inset-0 bg-[#0000006a] flex items-center justify-center"
      style={{ zIndex: 2147483647 }}
    >
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
            <button
              onClick={() => rotate(-1)}
              title="Rotate left"
              className="p-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            <button
              onClick={() => rotate(1)}
              title="Rotate right"
              className="p-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </button>
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

  if (!isMounted) return null;

  return createPortal(content, document.body);
}
