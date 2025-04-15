"use client";
import CustomNavbar from "components/Home/CustomNav";
function CustomNavbarServer({ lang }: { lang: string }) {
  try {
    return <CustomNavbar init={lang} />;
  } catch (error) {
    console.error("Error loading navbar:", error);
    return <></>;
  }
}

export default CustomNavbarServer;
