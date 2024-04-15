import { ReactElement } from "react";
interface BarDescribtionProps {
  name: string;
  desc: string;
}
function BarDescribtion({ name, desc }: BarDescribtionProps): ReactElement {
  return (
    <div className="bar-desc-column">
      <div className="bar-name">{name}</div>
      <div className="bar-desc">{desc}</div>
    </div>
  );
}

export default BarDescribtion;
