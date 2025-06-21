import Setting from "components/global/Setting";
import { settingsPagePropsType } from "models/componentType/settingsType/settingsPagePropsType";
import React from "react";

async function page({ params }: settingsPagePropsType) {
  return (
    <>
      <Setting lang={params.lang} />
    </>
  );
}

export default page;
