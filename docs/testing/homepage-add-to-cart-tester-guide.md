# Home page — Add to Cart, Cart and Order — Tester Guide

A list of test cases for **adding a product to the bag from the home page**, and
for everything that follows: the cart, and placing the order.

No coding needed. Follow the steps and compare what you see with the
**Expected** line.

---

## 1. Before you start

**Open the site with the `sy-en` address.**

```
http://localhost:3000/sy-en          ✓
http://localhost:3000/gb-en          ✗ opens the region picker over the page
```

`gb` is not in the region list, so the app puts a "Select Your Region" window
over the page and every tap lands on it. `sy` works.

**You need two accounts:**

| Name in this guide | How to get it |
|---|---|
| **Guest** | Open the site in a new private window. Do not sign in. |
| **Verified user** | Sign in and finish the phone code step. |

To go back to a guest: open the side menu and press **Logout**. The **Logout**
item only appears for a verified user. If you cannot see it, you are already a
guest.

**Where the buy button is on the home page.** Only three rows have product cards
with a buy button:

1. **Featured Products**
2. **Flash Deals**
3. **Recommended Products**

The boutiques list and the stories bar have no buy button.

---

## 2. Rules that apply to the whole flow

Read these first. Most cases below check one of these rules.

- A **guest can add products to the bag**. Nothing on the home page and nothing
  in the add-to-bag sheet asks a guest to sign in.
- The **sign-in wall comes later** — at the order button inside the cart.
- The **buy button on a card does not open the product page.** It opens the
  add-to-bag sheet over the home page.
- The **cart icon badge** at the top counts **lines in the bag**, not the total
  number of pieces. Two pieces of one product still show `1`.
- The **price on the card is only for display.** The real price comes from the
  server. The sheet and the cart are the prices that count.
- The **cart lives on the server**, not in the browser. After a reload the bag
  is still there.
- When a **guest verifies a phone number**, the guest bag is **joined** to the
  bag the account already had. Nothing is thrown away.
- The join only works while the **guest session is still alive**. If the guest
  session dies and cannot be renewed, the app makes a new guest. The old bag and
  the other guest information are then gone, and there is nothing left to join.

---

## 3. The buy button on the home page

### HB-1 — The buy button is on every product card
1. Open the home page.
2. Look at the cards in **Featured Products** and in **Flash Deals**.
3. **Expected:** each card has a small **Buy** label with a bag icon in the
   bottom corner. In Arabic and Kurdish it sits on the other side.

### HB-2 — The buy button opens the sheet, not the product page
1. Tap **Buy** on any card.
2. **Expected:** a white sheet slides up from the bottom. The address in the
   browser bar does **not** change to the product page.

### HB-3 — Tapping the card itself still opens the product
1. Tap the picture or the name of the same card, not the **Buy** label.
2. **Expected:** the product page opens.

### HB-4 — Works as a guest
1. Open the home page in a private window. Do not sign in.
2. Tap **Buy** on any card.
3. **Expected:** the sheet opens. No sign-in screen, no phone code screen.

### HB-5 — Recommended row
1. Open the home page as a **verified user**.
2. Scroll to **Recommended Products**.
3. **Expected:** the row shows cards with the same **Buy** label. If the account
   has no recommendations yet, the whole row is missing. An empty row is never
   shown.

---

## 4. The add-to-bag sheet

### AB-1 — What the sheet shows
1. Tap **Buy** on a product that has colours and sizes.
2. **Expected:** the sheet shows the product picture, the brand, the name, the
   price, a colour row, a size row, and a large purple **Add To Bag** button at
   the bottom.

### AB-2 — A colour and a size are already picked
1. Open the sheet for a product with colours and sizes.
2. **Expected:** one colour and one size are already selected. The app picks the
   first colour that still has stock, then the first size in stock for that
   colour.

### AB-3 — Add one piece
1. Open the sheet and press **Add To Bag**.
2. **Expected:** the bag icon moves, the button text changes to **Added To Your
   Bag** for about a second, and the cart badge at the top goes up by one.

### AB-4 — Add a second piece of the same choice
1. Press **Add To Bag** again on the same colour and size.
2. **Expected:** the button now reads **Add More to Your Bag**. A round minus
   button appears on the left side of the button with the quantity on it.

### AB-5 — Lower the quantity
1. With quantity 2, press the round **minus** button.
2. **Expected:** the text says **Removed From Your Bag** and the quantity drops
   to 1.

### AB-6 — Remove the last piece
1. With quantity 1, press the **minus** button.
2. **Expected:** the product leaves the bag. The cart badge goes down by one.

### AB-7 — Maximum quantity
1. Find a product with a maximum quantity, and add it up to that number.
2. **Expected:** the button turns grey and reads **Max Allowed Quantity
   Reached**. Pressing it again shows the same message and adds nothing.

### AB-8 — A missing size is refused
1. Open a product with sizes and un-pick the size, if you can.
2. Press **Add To Bag**.
3. **Expected:** the size row shakes and turns light red, the page scrolls to
   it, and nothing is added.

### AB-9 — A missing colour is refused
1. Do the same with the colour row.
2. **Expected:** the colour row shakes and turns light red, and nothing is
   added.

### AB-10 — Low stock warning
1. Open a product where a size has 10 pieces or fewer.
2. **Expected:** that size shows **Last N**, where N is the number left.

### AB-11 — A sold-out size
1. Open a product with one size sold out.
2. Pick that size.
3. **Expected:** the size shows **Not Available Now, Stock Is Sold Out** and the
   add button is replaced by **Notify Me When Variant Is Available**.

### AB-12 — Notify me
1. Press **Notify Me When Variant Is Available**.
2. Allow notifications when the browser asks.
3. **Expected:** the text changes to **We Will Inform You When Variant Is
   Available**.

### AB-13 — Notify me with notifications blocked
1. Block notifications in the browser, then press the notify button.
2. **Expected:** a red message appears: *Notification Is Not Enabled! please
   Allow Notification Access*.

### AB-14 — Close the sheet, three ways
1. Open the sheet. Tap the dark area above it.
2. Open it again. Press the **Esc** key.
3. Open it again. Drag the small grey bar at the top of the sheet downwards.
4. **Expected:** every time the sheet slides down and closes, and the home page
   is where it was.

### AB-15 — Changing the colour changes the picture and the price
1. Open a product with several colours and tap a different colour.
2. **Expected:** the picture and the price in the sheet follow the colour you
   picked.

---

## 5. Luck and flash-deal cards

These cards have extra logic. Test them on their own.

### LK-1 — A luck card looks different
1. Find a card with an **orange border** and an orange label on top reading
   **Luck! Add To Bag Within N seconds**.
2. **Expected:** the buy corner shows an orange price and a countdown like
   `-42s`, next to the word **Buy**.

### LK-2 — The countdown runs
1. Watch the number for ten seconds.
2. **Expected:** it goes down by one every second. It starts at 50.

### LK-3 — The countdown stops when you are not looking
1. Note the number, then switch to another browser tab for 15 seconds.
2. Come back.
3. **Expected:** the number carried on from about where you left it. It did not
   lose the 15 seconds.

### LK-4 — The countdown stops when the card is off screen
1. Note the number, scroll the card far out of view for 15 seconds, scroll back.
2. **Expected:** the same as LK-3 — it carried on from where it stopped.

### LK-5 — The offer ends at zero
1. Let a countdown reach 0 without adding the product.
2. **Expected:** the orange label and the orange price go away. The normal price
   comes back. The card keeps working as a normal card.

### LK-6 — Adding ends the offer at once
1. Open the sheet for a luck product while the countdown is still running and
   press **Add To Bag**.
2. **Expected:** the product goes into the bag at the luck price. The orange
   label and countdown for that card go away straight away.

### LK-7 — A used offer does not come back
1. After LK-5 or LK-6, reload the home page.
2. **Expected:** that product shows the normal price with no countdown. It stays
   this way for this browser.

### LK-8 — Only the last 5 are remembered
1. Let 6 different luck products run out.
2. Reload the home page.
3. **Expected:** the app only keeps a record for the **last 5**. The oldest one
   may show its offer again. This is on purpose.

### LK-9 — A flash-deal card
1. Find a card with an orange border and a small banner with a time left on it.
2. **Expected:** the price on the card is the deal price. The deal runs until the
   **end of its last day**, in your own local time — not until midnight UTC.

### LK-10 — The deal price is real
1. Note the price on a flash-deal card.
2. Open the sheet, add the product, and open the cart.
3. **Expected:** the price in the sheet and in the cart match the card. If they
   do not, report it with the product name and both prices.

---

## 6. The cart

### CT-1 — Open the cart
1. Add one product from the home page.
2. Press the **cart icon** at the top of the page.
3. **Expected:** the cart opens over the page, and the address in the browser bar
   gains `?cart=true`.

### CT-2 — Open the cart straight from a link
1. Copy the address with `?cart=true` and open it in a new tab.
2. **Expected:** the home page loads with the cart already open.

### CT-3 — The badge counts lines
1. Add 3 pieces of one product and 1 piece of another.
2. **Expected:** the badge shows **2**, not 4.

### CT-4 — What a cart row shows
1. Open the cart with a product that has a colour and a size.
2. **Expected:** the row shows the picture, the name, the price, **Color**,
   **Size**, the quantity, and the shipping days.

### CT-5 — Empty cart
1. Remove everything from the cart.
2. **Expected:** the cart shows **Cart is Empty**.

### CT-6 — The bag survives a reload
1. Add two products, then reload the page (F5).
2. Open the cart.
3. **Expected:** both products are still there, with the same quantities.

### CT-7 — The bag survives for a guest too
1. Do CT-6 in a private window, without signing in.
2. **Expected:** the bag is still there after the reload.

### CT-8 — Browser back closes the cart
1. Open the cart, then press the browser **back** button.
2. **Expected:** the cart closes and you are back on the home page. You are not
   sent to another page.

### CT-9 — An out-of-stock item is marked
1. Put a product in the bag, then have it made unavailable.
2. Open the cart.
3. **Expected:** the row shows **Availabilty: Out Of Stock**.

---

## 7. Guest and verified user — where they split

This is the only place the two are treated differently.

### GV-1 — A guest is stopped at the order button
1. As a **guest**, add a product from the home page.
2. Open the cart and press the big order button at the bottom.
3. **Expected:** the button turns into a **phone verify panel** inside the cart.
   It asks for a phone number and then a code. The checkout does **not** open.

### GV-2 — After verifying, the flow carries on by itself
1. Finish the phone code in the panel from GV-1.
2. **Expected:** the panel closes and the checkout opens on its own. You do not
   have to press the button again.

### GV-3 — A verified user goes straight through
1. As a **verified user** with a product in the bag, press the order button.
2. **Expected:** the checkout opens straight away, with no phone panel.

### GV-4 — The two bags are joined when a guest verifies
1. Sign in as a **verified user** and put **product A** in the bag. Sign out.
2. As a **guest**, put **product B** in the bag.
3. Press the order button and verify with the **same phone number** as step 1.
4. **Expected:** the bag now holds **both A and B**. The guest bag is joined to
   the account bag, not thrown away and not replacing it.

### GV-5 — A dead guest session loses the bag
1. As a guest, add two products.
2. Open the browser tools, go to **Application → Cookies**, and delete both
   **`MARKET-TOKEN`** and **`MARKET-REFRESH-TOKEN`**.
3. Reload the page and open the cart.
4. **Expected:** the bag is **empty**. The app could not renew the guest session,
   so it made a **new guest**. The old bag and the other guest information are
   gone. This is correct — it is not a bug.
5. Now verify a phone number.
6. **Expected:** nothing is joined from step 1. Only what the account already had
   comes back.

### GV-6 — An empty bag closes the cart
1. With an empty bag, press the order button.
2. **Expected:** the cart closes. No checkout opens.

### GV-7 — An unavailable product blocks the way
1. Put an out-of-stock product in the bag and press the order button.
2. **Expected:** a red message: *Please Review Your Cart Some Products Not
   Available*. The checkout does not open.

---

## 8. Checkout — address and payment

### CO-1 — The confirm button starts grey
1. Open the checkout with no address saved and no payment picked.
2. **Expected:** the **Confirm Shipping & Payment** button is grey and does
   nothing.

### CO-2 — No address
1. Press the grey confirm button with no address saved.
2. **Expected:** a red message: *Please Select an Address*, and the address block
   shakes.

### CO-3 — Add an address, empty fields
1. Open the address form and press **Add & Save** with the fields empty.
2. **Expected:** the form does not save. The first missing field shakes and the
   page scrolls to it.

### CO-4 — Add an address, all fields
1. Fill in: user name, detailed address, address title, region, recipient name,
   and a phone of at least 5 characters.
2. Press **Add & Save**.
3. **Expected:** the address is saved and shows in the checkout as the delivery
   address.

### CO-5 — A short phone is refused
1. In the address form, type a phone of 4 characters or fewer and save.
2. **Expected:** the phone field shakes. Nothing is saved.

### CO-6 — Pick a payment method
1. In the payment block, tap **Cash On Delivery**.
2. **Expected:** it gets a blue border, and the shipping cost shows next to it.

### CO-7 — Tap the same method again
1. Tap **Cash On Delivery** a second time.
2. **Expected:** it is unpicked. The confirm button goes grey again.

### CO-8 — A full wallet takes over
1. Use an account whose **RDB Wallet** balance covers the whole total.
2. Open the checkout.
3. **Expected:** the wallet is picked on its own. Cash On Delivery, Credit Cards
   and Crypto are greyed out and cannot be tapped.

### CO-9 — A wallet that is too small is locked
1. Use an account whose wallet balance is **less** than the total.
2. **Expected:** the wallet row is greyed out and cannot be picked. The other
   methods work normally.

### CO-10 — Refresh the wallet balance
1. Press the small refresh icon beside the wallet row.
2. **Expected:** the icon spins and the balance is read again.

### CO-11 — A discount coupon
1. Open **I Have a Discount Coupon**, type a valid code, press **Apply**.
2. **Expected:** the button shows **Applying…**, then the discount appears as a
   minus amount, and the total goes down.

### CO-12 — A wrong coupon
1. Type a code that does not exist and press **Apply**.
2. **Expected:** a message says the coupon did not work. The total does not
   change.

### CO-13 — Confirm shipping and payment
1. With an address and a payment method set, press **Confirm Shipping &
   Payment**.
2. **Expected:** the button is blue. The app reads the bag again, then moves to
   the **Place Order** step.

### CO-14 — The phone is checked again here
1. Reach CO-13 with an account whose phone verification was removed.
2. **Expected:** a red message: *Please Verify Your Phone Number*, and you go
   back one step.

---

## 9. Placing the order

### OD-1 — The terms box must be ticked
1. On the Place Order step, do not tick the terms box, and press **Place Order**.
2. **Expected:** the terms row shakes. The order is not placed. The button stays
   grey.

### OD-2 — Tick the terms
1. Tick **I read and agree to the policies and terms**.
2. **Expected:** the tick shows a short spinner, then stays ticked. The **Place
   Order** button turns blue.

### OD-3 — Place a cash-on-delivery order
1. With Cash On Delivery picked and the terms ticked, press **Place Order**.
2. **Expected:** a spinner runs, then a success screen shows **The Purchase Was
   Completed Successfully** with an **order number**.

### OD-4 — The bag is emptied after a success
1. On the success screen, press **Done / Back To HomePage**.
2. **Expected:** the home page opens and the cart badge is gone. The bag is
   empty.

### OD-5 — Pay with the wallet
1. Pick the wallet as the payment method and press **Place Order**.
2. **Expected:** a **Wallet Payment** window opens. It asks for a currency and
   shows the amount and your balance. **Confirm Wallet Payment** finishes the
   order.

### OD-6 — Wallet with too little money
1. In the wallet window, try to pay more than your balance.
2. **Expected:** a red message: *Insufficient wallet balance*. Nothing is paid.

### OD-7 — Card or crypto sends you out
1. Pick **Credit Cards** or **Crypto** and place the order.
2. **Expected:** the app opens the outside payment page. Write down whether you
   come back to the app after paying, and what you see.

### OD-8 — The bag is checked one last time
1. Place an order for a product that went out of stock while you were in the
   checkout.
2. **Expected:** a red message: *Please Review Your Cart Some Products Not
   Available*, and you are sent back to the cart. No order is created.

### OD-9 — The order appears in My Orders
1. After OD-3, open **My Account / My Orders**.
2. **Expected:** the new order is in the list, with the order number from the
   success screen.

---

## 10. What to write in a bug report

Please always give:

1. **Who** — guest or verified user.
2. **The address** you were on, for example `/sy-en`.
3. **The product name**, and the colour and size you picked.
4. **The case number** from this guide, for example `AB-7`.
5. **What you expected** and **what happened**.
6. A screenshot, and the exact words of any red message.
