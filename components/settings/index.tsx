"use client";

import { useEffect, useState } from "react";
import MainSetting from "./MainSetting";
import Profile from "./Profile";
import UploadProfilePhoto from "./UploadProfilePhoto";
import PersonalInfo from "./PersonalInfo";
import ProfileSizeInfo from "./ProfileSizeInfo";
import PersonalInfoAddress from "./PersonalInfoAddress";
import PersonalInfoAddressModal from "./PersonalInfoAddressModal";
import PersonalBankCards from "./PersonalBankCards";
import PersonalInfoCountries from "./PersonalInfoCountries";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import OrdersList from "./OrdersList";
import { OrderItem as OrderItemType } from "types/orders";
import OrderDetails from "./OrderDetails";
import { useDispatch, useSelector } from "react-redux/es";
import Spinner from "components/global/Spinner";

interface SettingOption {
  id: string;
  title: string;
  component: React.ReactNode;
  parentId?: string;
  isOption?: boolean;
  options?: SettingOption[];
  onBack?: () => void;
}

function Settings({ lang }: { lang: string }) {
  const userProfile = useSelector(
    (state: StateInterface) => state.auth.userProfile
  );

  const dispatch = useDispatch();
  const setSelectedOrder = (order) => {
    dispatch({ type: "ORDER-DETAILS", payload: order });
  };
  const [NavigationOptions, setNavigationOptions] = useState<SettingOption[]>([
    {
      id: "main",
      title: "main setting",
      component: (
        <MainSetting swipeToScreen={(index: number) => swipeToScreen(index)} />
      ),
      parentId: null,
    },
    {
      id: "Profile",
      title: "Profile",
      component: (
        <Profile
          goBack={() => swipeToScreen(0)}
          swipeToScreen={(index) => swipeToScreen(index)}
        />
      ),
      parentId: "main",
    },
    {
      id: "Upload Profile Photo",
      title: "Upload Profile Photo",
      component: (
        <UploadProfilePhoto
          goBack={() => swipeToScreen(1)}
          swipeToScreen={(index) => swipeToScreen(index)}
        />
      ),
      parentId: "Profile",
    },
    {
      id: "Personal Info",
      title: "Personal Info",
      component: (
        <PersonalInfo
          goBack={() => swipeToScreen(1)}
          swipeToScreen={(index) => swipeToScreen(index)}
        />
      ),
      parentId: "Profile",
    },
    {
      id: "Personal Size",
      title: "Size",
      component: (
        <ProfileSizeInfo
          goBack={() => swipeToScreen(1)}
          swipeToScreen={(index) => swipeToScreen(index)}
        />
      ),
      parentId: "Personal Info",
    },
    {
      id: "Personal Address",
      title: "Address",
      component: (
        <PersonalInfoAddress
          goBack={() => swipeToScreen(1)}
          swipeToScreen={(index) => swipeToScreen(index)}
        />
      ),
      parentId: "Personal Info",
    },
    {
      id: "Personal Address Modal",
      title: "Address Details",
      component: (
        <PersonalInfoAddressModal
          goBack={() => swipeToScreen(1)}
          swipeToScreen={(index) => swipeToScreen(index)}
        />
      ),
      parentId: "Personal Info",
    },
    {
      id: "Personal Bank cards",
      title: "Bank Cards",
      component: (
        <PersonalBankCards
          goBack={() => swipeToScreen(1)}
          swipeToScreen={(index) => swipeToScreen(index)}
        />
      ),
      parentId: "Personal Info",
    },
    {
      id: "Personal Countries",
      title: "Countries",
      component: (
        <PersonalInfoCountries
          goBack={() => swipeToScreen(0)}
          swipeToScreen={(index) => swipeToScreen(index)}
        />
      ),
      parentId: "Personal Info",
    },
    {
      id: "Orders",
      title: "Orders",
      component: (
        <OrdersList
          goBack={() => swipeToScreen(0)}
          swipeToScreen={(index) => swipeToScreen(index)}
          setSelectedOrder={(order) => setSelectedOrder({ ...order })}
        />
      ),
      parentId: "main",
    },
    {
      id: "Order Details",
      title: "Details",
      component: (
        <OrderDetails
          resetOrderDetails={() => setSelectedOrder(null)}
          goBack={() => swipeToScreen(9)}
        />
      ),
      parentId: "Orders",
    },
  ]);
  let searchParams = useSearchParams();
  let activeTab = searchParams.get("tab");
  const [currentScreen, setCurrentScreen] = useState(
    activeTab && activeTab !== "Order Details"
      ? // @ts-ignore
        NavigationOptions.findIndex((option) => option.id === activeTab)
      : 0
  );
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!activeTab) {
      // @ts-ignore
      router.push(`${pathname}?tab=${NavigationOptions[0].id}`, {
        // @ts-ignore
        shallow: true,
      });
    }
  }, []);
  const router = useRouter();
  const pathname = usePathname();
  const swipeToScreen = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentScreen(index);
    if (NavigationOptions[index].id !== "Order Details") {
      let newParams = new URLSearchParams(searchParams);
      newParams.set("tab", NavigationOptions[index].id);
      // @ts-ignore
      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    }
    // @ts-ignore
    setTimeout(() => setIsAnimating(false), 300); // Match transition duration
  };
  if (!userProfile)
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Spinner className="scale-150" />
      </div>
    );
  return (
    <div className="max-h-full h-full overflow-auto flex w-full max-w-[1365px] justify-center bg-white">
      {/* Sidebar Navigation */}

      {/* Main Content Area */}
      <div className="w-full h-full flex-1 relative overflow-hidden">
        <div
          className="absolute w-full h-full transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentScreen * 100}%)`,
          }}
        >
          {NavigationOptions.map((option, index) => (
            <div
              key={option.id}
              className={`${
                [currentScreen - 1, currentScreen, currentScreen + 1].includes(
                  index
                )
                  ? "opacity-1"
                  : "opacity-0"
              } absolute top-0 left-0 w-full h-full text-black overflow-auto pb-[100px]`}
              style={{ transform: `translateX(${index * 100}%)` }}
            >
              {option.component}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Settings;
