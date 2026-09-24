// The two names the app calls to show a short message.
//
// They are thin: both hand the message straight to the shared notification
// store, which `components/global/NotificationsContainer.tsx` draws. The name of
// this file is older than what it does — the callers are not only add-to-cart.
// `utils/fetchData.ts` sends every backend "message" field through here, and so
// does the seller dashboard (product editor, boutique editor, locations, shop
// info).
//
// WHAT USED TO BE HERE, AND WHY IT IS GONE
// This file also built a second, hand-made toast out of raw DOM nodes: an
// element, an inline <style> block, its own dismiss timer and two inline SVG
// icons. It only ran when `.message-add-to-cart` was on the page:
//
//   if (document.querySelector(".message-add-to-cart ")) showToast(...)
//   else showErrorNotification(...)
//
// That element lived in `components/Cart/AddToCartComponent.tsx`, which was
// deleted whole in 1687bdee ("Remove unused files and components", 2025-09-22).
// Nothing has rendered the class since, so the guard never matched and the
// toast never ran — every call took the `else` branch. The same was true of the
// two other classes it reached for, `.product_details_addtocart` and
// `.color_option_cyrcle`, and of its two icon constants, which nothing read
// even while the toast was alive.
//
// Checked before removing: `message-add-to-cart`, `product_details_addtocart`
// and `color_option_cyrcle` appear nowhere in the repository except in the code
// that was looking them up, and the captured session of the deployed site
// (security-check/dev.trydos.com.har) shows the same — the shipped bundle only
// ever queries the class, no element carries it.
import {
  showErrorNotification,
  showSuccessNotification,
} from "store/notifications/reducer";

export const showSuccessMessage = (message: string) => {
  showSuccessNotification(message);
};

export const showErrorMessage = (message: string) => {
  showErrorNotification(message);
};
