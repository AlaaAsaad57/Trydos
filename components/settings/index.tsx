"use client";

import { useState } from "react";
import MainSetting from "./MainSetting";
import Profile from "./Profile";
import UploadProfilePhoto from "./UploadProfilePhoto";
import PersonalInfo from "./PersonalInfo";
import ProfileSizeInfo from "./ProfileSizeInfo";
import PersonalInfoAddress from "./PersonalInfoAddress";

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
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

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
      id: "Personal Bank cards",
      title: "Bank Cards",
      component: <div>Bank cards</div>,
      parentId: "Personal Info",
    },
    {
      id: "Personal Countries",
      title: "Countries",
      component: <div>Countries</div>,
      parentId: "Personal Info",
    },
    {
      id: "Orders",
      title: "Orders",
      component: <div>Orders</div>,
      parentId: "main",
    },
    {
      id: "Order Details",
      title: "Details",
      component: <div>Details</div>,
      parentId: "Orders",
    },
  ]);

  const swipeToScreen = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentScreen(index);
    setTimeout(() => setIsAnimating(false), 300); // Match transition duration
  };

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
              className="absolute top-0 left-0 w-full h-full text-black overflow-auto pb-[100px]"
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
