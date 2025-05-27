import Setting from "components/global/Setting";
import React from "react";

async function page({ params }) {
  return (
    <>
      <Setting lang={params.lang} />
    </>
  );
}

export default page;
