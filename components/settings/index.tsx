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
import {
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
  GA_GLOBAL_SCREEN,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import {
  SettingOption,
  SettingsIndexPropsType,
} from "models/componentType/settingTypes/SettingsIndexPropsType";
import home from "services/home";
import { dispatchRouteChangeEvent } from "utils/events";

function Settings({ lang }: SettingsIndexPropsType) {
  const {
    setIsActiveAddress,
    userProfile,
    setOrderDetails,
    setAddressDetails,
    showOrderOptions,
    setSelectedOrderItem,
    setOrderOptions,
    selectedOrder,
  } = useAppStore();
  let language = lang.split("-")[1];
  const setSelectedOrder = (order) => {
    setOrderDetails(order);
  };
  const setIsActive = (e) => {
    setIsActiveAddress(e);
  };
  const getCustomerInfo = async () => {
    await home.getCustomerInfo();
    dispatchRouteChangeEvent("completed");
  };
  useEffect(() => {
    if (!userProfile?.name) {
      getCustomerInfo();
    } else {
      dispatchRouteChangeEvent("completed");
    }
  }, []);
  const [NavigationOptions, setNavigationOptions] = useState<SettingOption[]>([
    {
      id: "main",
      title: "main setting",
      component: () => (
        <MainSetting swipeToScreen={(index: number) => swipeToScreen(index)} />
      ),
      parentId: null,
    },
    {
      id: "Profile",
      title: "Profile",
      component: () => (
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
      component: () => (
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
      component: () => (
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
      component: () => (
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
      component: () => (
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
      component: () => (
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
      component: () => (
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
      component: () => (
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
      component: () => (
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
      component: () => (
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
      component: () => <LanguageSetting goBack={() => swipeToScreen(0)} />,
    },
  ]);
  const searchParams = useSearchParams();
  let activeTab = searchParams.get("tab");
  const orderIdParam = searchParams.get("id");

  const orderDetailsIndexRef = NavigationOptions.findIndex(
    (opt) => opt.id === "Order Details"
  );
  const [currentScreen, setCurrentScreen] = useState(() =>
    orderIdParam
      ? orderDetailsIndexRef
      : activeTab && activeTab !== "Order Details"
      ? // @ts-ignore
        NavigationOptions.findIndex((option) => option.id === activeTab)
      : 0
  );
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!activeTab) {
      // @ts-ignore
      router.push(`/${lang}/setting?tab=${NavigationOptions[0].id}`, {
        // @ts-ignore
        shallow: true,
      });
    }
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: GA_GLOBAL_SCREEN.SETTINGS_SCREEN,
        platform: GA_GLOBAL_PLATFORM.WEB,
        timestamp: new Date().toISOString(),
        screen_path: window.location.pathname,
      },
    });
  }, []);

  useEffect(() => {
    if (orderIdParam) {
      if (!selectedOrder?.id) {
        setOrderDetails({ id: orderIdParam, order_group_id: orderIdParam });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdParam]);

  const router = useRouter();
  const pathname = usePathname();
  const swipeToScreen = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentScreen(index);
    if (NavigationOptions[index].id !== "Order Details") {
      let newParams = new URLSearchParams(searchParams);
      newParams.delete("id");
      newParams.set("tab", NavigationOptions[index].id);
      // @ts-ignore
      router.push(`/${lang}/setting?${newParams.toString()}`, {
        // @ts-ignore
        shallow: true,
      });
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
          {NavigationOptions.map((option, index) => {
            if (
              ![currentScreen - 1, currentScreen, currentScreen + 1].includes(
                index
              )
            ) {
              return null;
            }
            return (
              <div
                key={option.id}
                id={option.id.split(" ").join("")}
                className="absolute top-0 left-0 w-full h-full text-black overflow-auto pb-[100px]"
                style={{ transform: `translateX(${index * 100}%)` }}
              >
                {option.component()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Settings;
