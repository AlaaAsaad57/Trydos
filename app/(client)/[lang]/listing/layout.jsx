import CategoriesBar from 'components/Home/CategoriesBar';
import 'styles/listing.css'
require( "external-svg-loader");
import dynamic from 'next/dynamic'
const Providers = dynamic(() => import("store/provider"), {
ssr: false,
});
export const metadata = {
  title: 'TryDos-Listing',
  description: 'Trydos Listing page',
}

export default function RootLayout({ children }) {

  return (
    
<>
<CategoriesBar forMobile={true} />
           {children}
</>
  )
}
