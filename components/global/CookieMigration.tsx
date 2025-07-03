// "use client";

// import { useEffect } from "react";
// import {
//   migrateFromLocalStorage,
//   setCookie,
//   COOKIE_NAMES,
//   type UserData,
// } from "@/utils/cookies/cookie-manager";

// /**
//  * Client component that migrates existing localStorage data to cookies
//  * This ensures backward compatibility for existing users
//  */
// export function CookieMigration() {
//   useEffect(() => {
//     // Only run on client side
//     if (typeof window === "undefined") return;

//     try {
//       // Migrate device token
//       const deviceToken = localStorage.getItem("DEVICE-TOKEN");
//       if (deviceToken) {
//         migrateFromLocalStorage("DEVICE-TOKEN", COOKIE_NAMES.DEVICE_TOKEN);
//       }

//       // Migrate market token
//       const marketToken = localStorage.getItem("MARKET-TOKEN");
//       if (marketToken) {
//         migrateFromLocalStorage("MARKET-TOKEN", COOKIE_NAMES.MARKET_TOKEN);
//       }

//       // Migrate guest user data
//       const guestUser = localStorage.getItem("guest-user");
//       if (guestUser) {
//         try {
//           const userData = JSON.parse(guestUser) as UserData;
//           setCookie(COOKIE_NAMES.USER_DATA, userData, {
//             maxAge: 365 * 24 * 60 * 60, // 1 year
//           });
//         } catch (e) {
//           console.error("Failed to migrate guest user data:", e);
//         }
//       }

//       // Migrate authenticated user data
//       const user = localStorage.getItem("USER");
//       if (user) {
//         try {
//           const userData = JSON.parse(user);
//           // For authenticated users, we might want to store less sensitive data
//           setCookie(
//             COOKIE_NAMES.USER_DATA,
//             {
//               id: userData.id,
//               name: userData.name,
//               phone: userData.phone || userData.mobilePhone,
//               is_phone_verified: userData.is_verified ? 1 : 0,
//               avatar: userData.avatar,
//             },
//             {
//               maxAge: 30 * 24 * 60 * 60, // 30 days for authenticated users
//             }
//           );
//         } catch (e) {
//           console.error("Failed to migrate user data:", e);
//         }
//       }

//       console.log("Cookie migration completed");
//     } catch (error) {
//       console.error("Cookie migration failed:", error);
//     }
//   }, []);

//   // This component doesn't render anything
//   return null;
// }
