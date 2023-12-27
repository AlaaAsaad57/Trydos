import '../../globals.css'
import '../../../styles/listing.css'
import dynamic from 'next/dynamic'
import CategoriesBar from '../../../components/Home/CategoriesBar';
const Providers = dynamic(() => import("../../../redux/provider"), {
ssr: false,
});
export async function generateMetadata({ params, searchParams }, parent) {
    // read route params
    const id = params.categories
    return {
      title: `Trydos - ${id}`,
      description:`Trydos ${id} Page`
    }
  }
export default function RootLayout({ children }) {  
  return (
      <>
        <CategoriesBar forMobile={true} />
           {children}
      </>

    

  )
}


