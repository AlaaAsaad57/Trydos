import Spinner from "components/global/Spinner";
import React from "react";

function FilterComponentLoader() {
  return (
    <>
      <div className="bg-[#f4f4f480] backdrop-blur-[10px] h-[100vh] flex fixed top-[103px] left-0 w-full z-[99]" />
      <div className="w-full flex h-[100vh] fixed top-[55px] lef-0 z-[999999999999999] justify-center items-center">
        <Spinner className=" scale-[4]" no={false} />
      </div>
    </>
  );
}

export default FilterComponentLoader;
