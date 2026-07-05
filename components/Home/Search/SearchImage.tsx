import React, { useState, useEffect } from "react";
import { LogError, translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { ImageCropWidget } from "components/global/ImageCropWidget";
import { CameraWidget } from "components/global/CameraWidget";
import { showErrorNotification } from "@/store/notifications/reducer";

// Device detection utility
const getDeviceCategory = () => {
  if (typeof navigator === "undefined") return "desktop";
  const userAgent = navigator.userAgent.toLowerCase();

  // Check for tablet first (more specific)
  if (
    userAgent.includes("ipad") ||
    userAgent.includes("tablet") ||
    (userAgent.includes("android") && !userAgent.includes("mobile")) ||
    userAgent.includes("kindle") ||
    userAgent.includes("silk") ||
    userAgent.includes("playbook") ||
    userAgent.includes("bb10") ||
    userAgent.includes("rim tablet")
  ) {
    return "tablet";
  }

  // Check for mobile devices
  if (
    userAgent.includes("mobile") ||
    userAgent.includes("iphone") ||
    userAgent.includes("ipod") ||
    userAgent.includes("android") ||
    userAgent.includes("blackberry") ||
    userAgent.includes("windows phone") ||
    userAgent.includes("palm") ||
    userAgent.includes("webos") ||
    userAgent.includes("symbian") ||
    userAgent.includes("fennec") ||
    userAgent.includes("maemo") ||
    userAgent.includes("minimo") ||
    userAgent.includes("plucker") ||
    userAgent.includes("xiino")
  ) {
    return "mobile";
  }

  // Default to desktop
  return "desktop";
};

function SearchImage({ setSearchValue }: { setSearchValue: Function }) {
  const { language } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(getDeviceCategory() === "desktop");
  }, []);

  const GemeniFunc = async (file) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", languageVariable);
      formData.append(
        "prompt",
        "Describe the product most clearly shown in this picture with no more than 5 words like: T-shirt black xxl",
      );
      const result = await fetch("/api/image-search", {
        method: "POST",
        body: formData,
        credentials: "omit",
      });
      if (!result.ok) {
        const response = await result.json();
        throw new Error(response.error || "Failed to search with image");
      }
      // @ts-ignore
      const response = await result.json();

      // Setting the search value drives the overlay's single GetSearchData
      // path directly (see SD-06); no separate store-based search needed.
      setSearchValue(response.response);
      setLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "GemeniFunc in SearchImage",
      });
      setLoading(false);
      showErrorNotification(
        translateFunction(
          error?.message ||
            error ||
            translateFunction("failed to search with image"),
        ),
      );

      setLoading(false);
    }
  };

  async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      // @ts-ignore
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  }

  const handleFileUpload = (event) => {
    setLoading(true);
    // @ts-ignore
    const fileLocal = event.target.files[0];
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
      "image/avif",
    ];

    if (fileLocal && allowedTypes.includes(fileLocal.type)) {
      setFile(fileLocal);
    } else {
      setLoading(false);
      alert(
        translateFunction(
          "please select supported image format (jpeg, png, jpg, webp, svg, avif)",
        ),
      );
      // @ts-ignore
      event.target.value = null;
    }
  };

  const handleCameraCapture = (capturedFile: File) => {
    setFile(capturedFile);
    setShowCamera(false);
  };

  const OpenMenu = () => {
    if (isDesktop) {
      setShowMenu(!showMenu);
    } else {
      // Mobile behavior - direct file upload
      let Image = document.createElement("input");
      Image.onblur = () => {};
      Image.onchange = handleFileUpload;

      Image.type = "file";
      Image.hidden = true;
      Image.accept = "*/*";

      Image.classList.add("absolute");
      Image.classList.add("opacity-0");
      let i = document.body.appendChild(Image);
      i.click();
    }
  };

  const handleMenuOptionClick = (option: "camera" | "file") => {
    setShowMenu(false);

    if (option === "camera") {
      setShowCamera(true);
    } else if (option === "file") {
      let Image = document.createElement("input");
      Image.onblur = () => {};
      Image.onchange = handleFileUpload;

      Image.type = "file";
      Image.hidden = true;
      Image.accept = "*/*";

      Image.classList.add("absolute");
      Image.classList.add("opacity-0");
      let i = document.body.appendChild(Image);
      i.click();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest(".search-image-container")) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div className="input-icon h-full search-image-container">
      {file && (
        <ImageCropWidget
          image={file}
          onClose={() => {
            setFile(null);
            setLoading(false);
          }}
          onSave={(e) => {
            GemeniFunc(e);
            setFile(null);
          }}
        />
      )}

      {showCamera && (
        <CameraWidget
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="relative" data-cy="searchImageIcon">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <img src="/icons/SearchCamIcon.svg" onClick={OpenMenu} />
            {isDesktop && showMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={() => handleMenuOptionClick("camera")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    tabIndex={0}
                    aria-label={translateFunction("Take photo with camera")}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {translateFunction("From Camera")}
                  </button>
                  <button
                    onClick={() => handleMenuOptionClick("file")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    tabIndex={0}
                    aria-label={translateFunction("Choose file from device")}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {translateFunction("From Files")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SearchImage;
