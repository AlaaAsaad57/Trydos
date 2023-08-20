import CategoriesBar from "./CategoriesBar"
import Logo from "./Logo"
import UserNavTopSection from "./UserNavTopSection"

function Navbar() {
  return (
    <div className="home-navbar">
        <Logo/>
        <CategoriesBar/>
        <UserNavTopSection/>
    </div>
  )
}

export default Navbar