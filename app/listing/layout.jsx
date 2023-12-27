import '../../styles/listing.css'
require( "external-svg-loader");
import {Providers} from "../../redux/provider"

export const metadata = {
  title: 'TryDos-Listing',
  description: 'Trydos Listing page',
}

export default function RootLayout({ children }) {

  return (
    <html lang="en">

     <link rel="icon" href="/favicon.ico" sizes="any" />
     
      <body>
     
        <Providers>
           {children}
        </Providers>
        </body>
    

    </html>
  )
}
