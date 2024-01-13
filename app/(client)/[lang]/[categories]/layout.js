import '../../../globals.css'
import 'styles/listing.css'
import CategoriesBar from 'components/Home/CategoriesBar';

export default function RootLayout({ children }) {  
  return (
      <>
        <CategoriesBar forMobile={true} />
           {children}
      </>

    

  )
}


