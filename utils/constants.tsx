import ManIcon from "public/svg/manIcon.svg";
import WomanIcon from "public/svg/WomanIcon.svg";
import KidsIcon from "public/svg/KidsIcon.svg";
import HomeIcon from "public/svg/HomeIcon.svg";
import ElectricalIcon from "public/svg/ElectricalIcon.svg";
import StoreIcon from "public/svg/ShopIcon.svg";

import SearchIcon from "public/svg/SearchIcon.svg";
import pngErr from "public/images/error.png";
export const categories = [
  {
    name: "Man",
    icon: <ManIcon />,
  },
  {
    name: "Woman",
    icon: <WomanIcon />,
  },
  {
    name: "Kids",
    icon: <KidsIcon />,
  },
  {
    name: "Home",
    icon: <HomeIcon />,
  },
  {
    name: "Electrical",
    icon: <ElectricalIcon />,
  },
  {
    name: "Shop",
    icon: <StoreIcon />,
  },
  {
    name: "Search",
    icon: <SearchIcon />,
  },
];

export const errorPNG = pngErr.src;
