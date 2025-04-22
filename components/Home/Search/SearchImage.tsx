import React, { useState } from "react";
import SearchCamIcon from "public/svg/SearchCamIcon.svg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { translateFunction } from "utils/functions";

import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import search from "services/search";

function SearchImage({ setSearchValue }: { setSearchValue: Function }) {
  const { language } = useAppStore();

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const [loading, setLoading] = useState(false);
  const GemeniFunc = async (file) => {
    let image_result = await fileToGenerativePart(file);
    const result = await model
      .generateContent([
        translate(
          "describe the product in the image with 6 words max like: T-shirt black xxl size",
          language
        ),
        image_result,
      ])
      .catch((e) => {
        setLoading(false);
      });
    // @ts-ignore
    const response = await result.response;
    const text = response.text();
    setSearchValue(text);
    setLoading(false);
    search.getSearchOptions({
      noProducts: false,
      lang: lang,
    });
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
      ];

      if (fileLocal && allowedTypes.includes(fileLocal.type)) {
        GemeniFunc(fileLocal);
      } else {
        alert("please select supported image");
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
    <div className="relative " data-cy="searchImageIcon">
      {loading ? <Spinner /> : <SearchCamIcon onClick={OpenMenu} />}
    </div>
  );
}

export default SearchImage;
