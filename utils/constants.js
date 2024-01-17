import ManIcon from "public/svg/manIcon.svg";
import WomanIcon from "public/svg/WomanIcon.svg";
import KidsIcon from "public/svg/KidsIcon.svg";
import HomeIcon from "public/svg/HomeIcon.svg";
import ElectricalIcon from "public/svg/ElectricalIcon.svg";
import StoreIcon from "public/svg/ShopIcon.svg";
import { Cloudinary } from "@cloudinary/url-gen";
import SearchIcon from "public/svg/SearchIcon.svg";

import { CHAT_URL } from "./endpointConfig";

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

export const myCld = () => {
  return new Cloudinary({
    cloud: {
      cloudName: "djooohujg",
    },
  });
};
export const pusher = async () => {
  let Pusher = (await import("pusher-js")).default;
  Pusher.logToConsole = process.env.NEXT_PUBLIC_ENABLE_LOG === "true";
  return new Pusher(`cd403c68a9fbb7ce7da6`, {
    cluster: "ap2",
    encrypted: true,
    channelAuthorization: {
      endpoint: CHAT_URL + "/broadcasting/auth",

      headersProvider: () => {
        return {
          Authorization: "Bearer " + localStorage.getItem("CHAT-TOKEN"),
        };
      },
    },
  });
};
