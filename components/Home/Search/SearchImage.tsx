import React, { useState } from "react";
import SearchCamIcon from "public/svg/SearchCamIcon.svg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import search from "services/search";
import { ImageCropWidget } from "components/global/ImageCropWidget";
import { showErrorNotification } from "@/store/notifications/reducer";
function SearchImage({ setSearchValue }: { setSearchValue: Function }) {
  const { language } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const GemeniFunc = async (file) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", languageVariable);
      formData.append(
        "prompt",
        "Describe the product most clearly shown in this picture with no more than 5 words like: T-shirt black xxl"
      );
      const result = await fetch("/api/image-search", {
        method: "POST",
        body: formData,
      });
      if (!result.ok) {
        const response = await result.json();
        throw new Error(response.error || "Failed to search with image");
      }
      // @ts-ignore
      const response = await result.json();

      setSearchValue(response.response);
      setLoading(false);
      search.getSearchOptions({
        noProducts: false,
        lang: lang,
      });
    } catch (error) {
      setLoading(false);
      showErrorNotification(
        translateFunction(
          error?.message ||
            error ||
            translateFunction("failed to search with image")
        )
      );
      console.log(error);
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

  const OpenMenu = () => {
    let Image = document.createElement("input");
    Image.onblur = () => {};
    Image.onchange = async (event) => {
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
          "please select supported image format (jpeg, png, jpg, webp, svg, avif)"
        );
        // @ts-ignore
        event.target.value = null;
      }
    };

    Image.type = "file";
    Image.hidden = true;
    Image.accept = "*/*";

    Image.classList.add("absolute");
    Image.classList.add("opacity-0");
    let i = document.body.appendChild(Image);
    i.click();
  };
  return (
    <div className="input-icon h-full">
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
      <div className="relative " data-cy="searchImageIcon">
        {loading ? <Spinner /> : <SearchCamIcon onClick={OpenMenu} />}
      </div>
    </div>
  );
}

export default SearchImage;
