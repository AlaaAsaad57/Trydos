import Setting from "components/global/Setting";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import React from "react";

async function page({ params }) {
  return (
    <>
      <CustomNavbarServer lang={params.lang} />
      <Setting />
    </>
  );
}

export default page;
