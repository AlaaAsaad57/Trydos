import Setting from "components/global/Setting";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import React from "react";

async function page({ params }) {
  return (
    <>
      <Setting lang={params.lang} />
    </>
  );
}

export default page;
