import React from "react";
async function MutateLoader({ url }) {
  return (
    <div
      style={{ width: "20px", height: "20px" }}
      className="svg-holder-r"
      dangerouslySetInnerHTML={{ __html: url }}
    />
  );
}

export default MutateLoader;
