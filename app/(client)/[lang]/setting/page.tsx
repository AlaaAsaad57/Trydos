import Settings from "components/settings";
import React from "react";
export const dynamic = "auto";
async function page({ params }) {
  return (
    <>
      <Settings lang={params.lang} />
    </>
  );
}

export default page;
