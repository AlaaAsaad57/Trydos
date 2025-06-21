import Settings from "components/settings";
import { settingPagePropsType } from "models/componentType/settingTypes/settingPagePropsType";
import React from "react";
export const dynamic = "auto";
async function page({ params }: settingPagePropsType) {
  return (
    <>
      <Settings lang={params.lang} />
    </>
  );
}

export default page;
