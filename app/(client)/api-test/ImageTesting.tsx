import Spinner from "components/global/Spinner";
import React, { useEffect, useState } from "react";

/*
  Expanded Cloudinary playground component.
  This version lets you tweak: crop modes, gravity, quality,
  background color, format, radius, effect, fetch format, etc.
  You can paste any image URLs you want into the textarea.

  It does NOT enforce correctness of Cloudinary params;
  it simply builds whatever URL you ask for so you can experiment freely.
*/

const cloudinaryCropModes = [
  { value: "fill", label: "Fill (c_fill)" },
  { value: "pad", label: "Pad (c_pad)" },
  { value: "fit", label: "Fit (c_fit)" },
  { value: "limit", label: "Limit (c_limit)" },
  { value: "scale", label: "Scale (c_scale)" },
  { value: "thumb", label: "Thumbnail (c_thumb)" },
  { value: "crop", label: "Crop (c_crop)" },
];

const gravityOptions = [
  { value: "auto", label: "Auto" },
  { value: "center", label: "Center" },
  { value: "faces", label: "Faces" },
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
];

const effectOptions = [
  { value: "none", label: "None" },
  { value: "blur:300", label: "Blur" },
  { value: "sharpen", label: "Sharpen" },
  { value: "grayscale", label: "Grayscale" },
  { value: "sepia", label: "Sepia" },
];

const qualityOptions = [
  { value: "q_auto", label: "Auto (q_auto)" },
  { value: "q_auto:best", label: "Best (q_auto:best)" },
  { value: "q_auto:good", label: "Good (q_auto:good)" },
  { value: "q_auto:eco", label: "Eco (q_auto:eco)" },
  { value: "q_auto:low", label: "Low (q_auto:low)" },
];
const ObjectFitOptions = [
  {
    label: "Fill",
    value: "fill",
  },
  { label: "Cover", value: "cover" },
  { label: "contain", value: "contain" },
];

const ImageTestingFull = () => {
  const [cropMode, setCropMode] = useState("pad");
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(290);
  const [quality, setQuality] = useState("q_auto:good");
  const [effect, setEffect] = useState("none");
  const [background, setBackground] = useState("auto");
  const [objectFit, setObjectFit] = useState<any>("contain");
  const [objectPosition, setObjectPosition] = useState<any>("top center");
  const [imageUrls, setImageUrls] = useState<string[]>([
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/hhprxgeaamp6xinfkmh6.png",
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821cae9a85a4.png",
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-08-11-689a176abbb75.png",
    "	https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-20-682c4205a7387.png",
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-11-68206fd6e8693.png",
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-09-14-68c696f930a33.png",
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-06-03-683eb177d676e.png",
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/a3mbnkvhfll19uwxxdyx.png",
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821f4684c309.png",
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/ywvahbwscaaynvfrdq6e.jpg",
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/ccien9rlyjbia6e4cq0d.jpg",
  ]);

  const [results, setResults] = useState<string[]>([]);

  const apply = () => {
    const out = imageUrls.map((url) => {
      const base = url.split("/upload/");
      setObjectFit("cover");
      if (base.length < 2) return url;

      const params: string[] = [];

      params.push(`c_${cropMode}`);

      if (Number.isNaN(width) || width === 0) {
      } else {
        params.push(`w_${width * 2}`);
      }

      if (Number.isNaN(height) || height === 0) {
      } else params.push(`h_${height * 2}`);

      if (quality) params.push(`${quality}`);

      if (background && cropMode === "pad") params.push(`b_${background}`);
      if (effect && effect !== "none") params.push(`e_${effect}`);
      params.push(`f_auto`);

      const transformationString = params.join(",");
      return `${base[0]}/upload/${transformationString}/${base[1]}`;
    });

    setResults(out);
    setShowOriginals(false);
  };

  const [showOriginals, setShowOriginals] = useState(true);
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <h2 className="text-xl font-semibold">
        Cloudinary Full Testing Playground
      </h2>

      {/* <textarea
        className="w-full border rounded-sm p-2 text-sm h-32"
        value={imageUrls.join("\n")}
        onChange={(e) => setImageUrls(e.target.value.split("\n"))}
        placeholder="Paste one image URL per line"
      /> */}

      <div className="flex flex-row gap-[10px] flex-wrap">
        <div>
          <label className="font-medium">Crop Mode</label>
          <select
            className="w-full border p-2 rounded-sm"
            value={cropMode}
            onChange={(e) => setCropMode(e.target.value)}
          >
            {cloudinaryCropModes.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-medium">
            Width(0 mean auto based on height)
          </label>
          <input
            type="number"
            className="w-full border p-2 rounded-sm"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
          />
        </div>

        <div>
          <label className="font-medium">
            Height(0 mean auto based on width)
          </label>
          <input
            type="number"
            className="w-full border p-2 rounded-sm"
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value))}
          />
        </div>

        {/* <div>
          <label className="font-medium">
            Format (auto, webp, png, jpg, etc.)
          </label>
          <input
            type="text"
            className="w-full border p-2 rounded-sm"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          />
        </div> */}
        <div>
          <label className="font-medium">Fit</label>
          <select
            className="w-full border p-2 rounded-sm"
            value={objectFit}
            onChange={(e) => setObjectFit(e.target.value)}
          >
            {ObjectFitOptions.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={apply}
        className="px-6 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700"
      >
        Apply Transformations
      </button>
      <button
        onClick={() => setShowOriginals(!showOriginals)}
        className="mx-[20px] px-6 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700"
      >
        show {showOriginals ? "Results" : "Originals"}
      </button>
      {showOriginals ? (
        <>
          <div className="flex items-center">Originals</div>
          <div className="flex flex-row flex-wrap gap-[10px] mt-4">
            {imageUrls.map((url, i) => (
              <div
                key={i}
                className="rounded-[15px] w-[200px] h-[290px] relative"
              >
                <span className="w-full h-full shadow-[inset_0px_3px_6px_rgb(255,255,255,0.5)] absolute top-0 left-0 z-10"></span>
                <svg
                  className="absolute z-20 top-0 left-0"
                  xmlns="http://www.w3.org/2000/svg"
                  width="200"
                  height="290"
                  viewBox="0 0 200 290"
                >
                  <g
                    id="Rectangle_6502"
                    data-name="Rectangle 6502"
                    fill="none"
                    stroke="#d3d3d3"
                    stroke-width="0.5"
                  >
                    <rect
                      x="0.25"
                      y="0.25"
                      width="199.5"
                      height="289.5"
                      rx="14.75"
                      fill="none"
                    />
                  </g>
                </svg>

                <img
                  src={url}
                  key={url}
                  alt="result"
                  className={`w-full h-full rounded-[15px] bg-black object-${objectFit}`}
                  style={{
                    objectFit: objectFit,
                    objectPosition: objectPosition,
                  }}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center">Results</div>
          <div className="flex flex-row flex-wrap gap-[10px] mt-4">
            {results?.length === 0 && (
              <div className="w-full items-center p-2 justify-center flex">
                <Spinner />
              </div>
            )}
            {results?.map((url, i) => (
              <div
                key={i}
                className="rounded-[15px] w-[200px] h-[290px] relative"
              >
                <span className="w-full h-full shadow-[inset_0px_3px_6px_rgb(255,255,255,0.5)] absolute top-0 left-0 z-10"></span>
                <svg
                  className="absolute z-20 top-0 left-0"
                  xmlns="http://www.w3.org/2000/svg"
                  width="200"
                  height="290"
                  viewBox="0 0 200 290"
                >
                  <g
                    id="Rectangle_6502"
                    data-name="Rectangle 6502"
                    fill="none"
                    stroke="#d3d3d3"
                    stroke-width="0.5"
                  >
                    <rect
                      x="0.25"
                      y="0.25"
                      width="199.5"
                      height="289.5"
                      rx="14.75"
                      fill="none"
                    />
                  </g>
                </svg>

                <img
                  src={url}
                  key={url}
                  alt="result"
                  className={`w-full h-full rounded-[15px] bg-black object-${objectFit}`}
                  style={{
                    objectFit: objectFit,
                    objectPosition: objectPosition,
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageTestingFull;
