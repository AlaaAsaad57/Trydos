import CustomNavbar from "components/Home/CustomNav";
import NavbarSkeleton from "components/skeleton/navbar";
import { Suspense } from "react";

async function CustomNavbarServer({ lang }: { lang: string }) {
  return (
    <Suspense fallback={<NavbarSkeleton noCategory={true} />}>
      <CustomNavbar init={lang} />
    </Suspense>
  );
}

export default CustomNavbarServer;
