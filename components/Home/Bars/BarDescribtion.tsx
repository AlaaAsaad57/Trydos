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
      className={`bar-desc-column ${
        language === "ar" ? "bar-desc-column-ar" : "bar-desc-column-en"
      }`}
    >
      <div className="bar-name">{name}</div>
      <div className="bar-desc">{desc}</div>
    </div>
  );
}

export default BarDescribtion;
