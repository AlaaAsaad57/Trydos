import CustomNavbarServer from "components/Server/ServerCustomNav";
import Settings from "components/settings";
import React from "react";
export const dynamic = "force-dynamic";
async function page({ params }) {
  return (
    <>
      <Settings lang={params.lang} />
    </>
  );
}

export default page;
