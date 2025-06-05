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

import OrderDetails from "./OrderDetails";

import { useAppStore } from "store";

import SettingsLoader from "components/skeleton/loaders/SettingsLoader";
import LanguageSetting from "./LanguageSetting";
import OrderOptions from "components/Orders/OrderOptions";

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
  const {
    setIsActiveAddress,
    userProfile,
    setOrderDetails,
    setAddressDetails,
    showOrderOptions,
    setOrderOptions,
  } = useAppStore();

  const setSelectedOrder = (order) => {
    setOrderDetails(order);
  };
  const setIsActive = (e) => {
    setIsActiveAddress(e);
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
          setIsActive={(e) => setIsActive(true)}
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
        <>
          {
            <PersonalInfoAddressModal
              goBack={() => {
                setAddressDetails(null);
                swipeToScreen(5);
              }}
              swipeToScreen={(index) => swipeToScreen(index)}
            />
          }
        </>
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
    {
      id: "Language",
      title: "Language",
      component: <LanguageSetting goBack={() => swipeToScreen(0)} />,
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
  if (!userProfile) return <SettingsLoader />;
  return (
    <div className="max-h-full h-full overflow-auto flex w-full max-w-[1365px] justify-center bg-white">
      {showOrderOptions && (
        <OrderOptions
          CancelOrder={() => {
            swipeToScreen(9);
          }}
          closeOptions={() => {
            document.documentElement.style.overflow = "auto";
            document.documentElement.scrollTop = 0;
            document.querySelector("#OrderDetails").scrollTop = 0;
            document
              .querySelector("#OrderDetails")
              .classList.remove("overflow-hidden");
            document
              .querySelector("#OrderDetails")
              .classList.add("overflow-auto");
            setOrderOptions(false);
          }}
        />
      )}
      {/* Sidebar Navigation */}

      {/* Main Content Area */}
      <div className="w-full h-full flex-1 relative overflow-hidden min-h-screen">
        <div
          className="absolute w-full h-full transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentScreen * 100}%)`,
          }}
        >
          {NavigationOptions.map((option, index) => (
            <div
              key={option.id}
              id={option.id.split(" ").join("")}
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
