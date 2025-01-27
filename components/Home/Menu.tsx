import React, { useState } from "react";
import Cookies from "js-cookie";
import { changeToken } from "store/homepage/cachedActions";
import { Sendevent } from "utils/functions";
import SettingsModal from "./SettingsModal"; // Import the SettingsModal component

interface MenuProps {
    user: any;
}

const Menu: React.FC<MenuProps> = ({ user }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSettingsClick = () => {
        setIsModalOpen(true); // Open settings modal
    };

    const handleLogout = () => {
        Sendevent({
            event: "button_clicked",
            value: "me_nav_bar_button",
        });
        localStorage.clear();
        changeToken({ key: "DEVICE-TOKEN", deleteOption: true });
        changeToken({ key: "MARKET-TOKEN", deleteOption: true });
        changeToken({ key: "token", deleteOption: true });
        Cookies.remove("DEVICE-TOKEN");
        Cookies.remove("MARKET-TOKEN");
        Cookies.remove("token");
        window.location.reload();
    };

    return (
        <div
            style={{
                position: "absolute",
                top: "50px",
                right: "10px",
                background: "#fff",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
                borderRadius: "8px",
                padding: "10px",
                zIndex: 1000,
            }}
        >
            {user ? (
                <>
                    <div
                        style={{
                            padding: "10px 15px",
                            cursor: "pointer",
                            color: "#333",
                        }}
                        onClick={handleSettingsClick} // Open settings modal
                    >
                        Settings
                    </div>
                    <div
                        style={{
                            padding: "10px 15px",
                            cursor: "pointer",
                            color: "#333",
                        }}
                        onClick={handleLogout} // Handle logout
                    >
                        Logout
                    </div>
                </>
            ) : (
                <div
                    style={{
                        padding: "10px 15px",
                        cursor: "pointer",
                        color: "#333",
                    }}
                    onClick={handleSettingsClick} // Open settings modal for non-logged-in users
                >
                    Settings
                </div>
            )}

            {/* Settings Modal */}
            {isModalOpen && <SettingsModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default Menu;
