import CategoriesBar from "components/Home/CategoriesBar";
import "styles/listing.css";
export const metadata = {
  title: "TryDos-Listing",
  description: "Trydos Listing page",
};

export default function RootLayout({ children }) {
  return (
    <>
      <CategoriesBar forMobile={true} />
      {children}
    </>
  );
}
