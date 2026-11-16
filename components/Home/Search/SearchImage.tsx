import { useState, useEffect } from "react";
import { LogError, translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { ImageCropWidget } from "components/global/ImageCropWidget";
import { CameraWidget } from "components/global/CameraWidget";
import { showErrorNotification } from "@/store/notifications/reducer";
import { imageToSearchJpeg } from "utils/imageToSearchJpeg";
import type { PhotoSearchFilters } from "services/elastic/similarProducts";
import { photoFiltersKey, requestSimilarProducts } from "./requestSimilarProducts";

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

/** What a photo search found, for the overlay to show. */
export type PhotoResults = {
  products: any[];
  /** The picture the shopper sent, as a data URL, to show beside the results. */
  preview: string;
  /** The picture as sent, so a filter change can search with it again. */
  picture: Blob;
  /** `photoFiltersKey` of the filters these products were found with. */
  filtersKey: string;
};

const readAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });

/** Answers of the photo route that the older route would answer the same way
 *  (no session, too big, too many calls, a picture it cannot read). The
 *  shopper sees the message, and nothing else is tried. */
const FINAL_STATUSES = [400, 401, 413, 429];

function SearchImage({
  setSearchValue,
  onPhotoResults,
  filters = {},
}: {
  setSearchValue: Function;
  /** The search box filters; the photo search uses them too. */
  filters?: PhotoSearchFilters;
  /** Given: the photo first looks for similar products by vector, and only
   *  falls back to the words search when that fails or finds nothing. */
  onPhotoResults?: (results: PhotoResults) => void;
}) {
  const { language } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  // @ts-ignore
  const country = lang.split("-")[0];

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(getDeviceCategory() === "desktop");
  }, []);

  /** Photo -> similar products. "done": results were shown. "stop": a
   *  message was shown. "fallback": try the words search. */
  const searchSimilarProducts = async (
    picture: File,
  ): Promise<"done" | "stop" | "fallback"> => {
    try {
      const result = await requestSimilarProducts({
        picture,
        language: languageVariable,
        country,
        filters,
      });
      if (result.ok && result.products.length > 0) {
        onPhotoResults?.({
          products: result.products,
          preview: await readAsDataUrl(picture),
          picture,
          filtersKey: photoFiltersKey(filters),
        });
        return "done";
      }
      // Nothing near enough: the words search may still find something.
      if (result.ok) return "fallback";
      if (FINAL_STATUSES.includes(result.status)) {
        showErrorNotification(
          translateFunction(result.error || "failed to search with image"),
        );
        return "stop";
      }
      LogError({
        error: `photo search by vector answered ${result.status}`,
        scenario: "searchSimilarProducts in SearchImage",
      });
      return "fallback";
    } catch (error) {
      LogError({ error, scenario: "searchSimilarProducts in SearchImage" });
      return "fallback";
    }
  };

  const searchPhoto = async (picked: File) => {
    setLoading(true);
    // Small JPEG for both routes: a phone photo is often over their 4 MB cap.
    const picture = await imageToSearchJpeg(picked);
    if (onPhotoResults) {
      const outcome = await searchSimilarProducts(picture);
      if (outcome !== "fallback") {
        setLoading(false);
        return;
      }
    }
    await GemeniFunc(picture);
  };

  // The older way: the photo becomes a few words, and text search runs on them.
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
      // The route refuses a call with no session cookie, so the cookie goes.
      const result = await fetch("/api/image-search", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
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
            searchPhoto(e);
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

      <div className="relative" data-pw="searchImageIcon">
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
