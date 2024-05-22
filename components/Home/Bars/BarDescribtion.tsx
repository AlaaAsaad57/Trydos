import { ReactElement } from "react";
import { cookies } from "next/headers";

interface BarDescribtionProps {
  name: string;
  desc: string;
}
function BarDescribtion({ name, desc }: BarDescribtionProps): ReactElement {
  let cookiesStore = cookies();
  const language = cookiesStore.get("language")?.value;

  return (
    <div
      className={`bar-desc-column flex flex-col justify-start  ${
        language === "ar" ? "items-end ml-0 mr-[5px]" : "items-start ml-[5px]"
      }`}
    >
      <div className="bar-name flex text-sm text-[#3c3c3c];">{name}</div>
      <div className="bar-desc flex text-[10px] text-[#505050];">{desc}</div>
    </div>
  );
}

export default BarDescribtion;
