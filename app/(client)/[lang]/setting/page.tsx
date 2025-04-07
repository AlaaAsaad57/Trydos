import CustomNavbarServer from "components/Server/ServerCustomNav";
import Settings from "components/settings";
import React from "react";

async function page({ params }) {
  return (
    <>
      <CustomNavbarServer lang={params.lang} />
      <Settings lang={params.lang} />
    </>
  );
}

export default page;
