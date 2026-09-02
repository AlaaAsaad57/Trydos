# Add to Cart, Cart and Order — Tester Guide

Test cases for **adding a product to the bag from every place the app offers
it**, and for everything that follows: the cart, the checkout, and the order.

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

---

## 2. Where a shopper can add to the bag

There are only **two** kinds of add button in the app.

1. The **Buy corner** — a small "Buy" label with a bag icon in the bottom corner
   of a product card.
2. The **Buy tab** — a purple tab in the fixed bar at the bottom of the product
   page.

Both open the **same add-to-bag sheet**. Neither one adds a product on its own.

| Surface | Address | Add button |
|---|---|---|
| Home page | `/sy-en` | Buy corner |
| Category home page | `/sy-en/categories/<slug>` | Buy corner |
| Listing / filters | `/sy-en/filters/...` | Buy corner |
| Featured listing | `/sy-en/featured/...` | Buy corner |
| Flash deals listing | `/sy-en/flashDeals/...` | Buy corner |
| Boutique page | `/sy-en/filters/boutiques/<slug>` | Buy corner |
| Product page | `/sy-en/products/<slug>` | Buy tab |
| Product modal | product page opened from a card | Buy tab |

**Places with no add button** — check these too, they must **not** grow one:

- the search drop-down results (they only open the product page)
- the boutiques row on the home page
- the stories bar
- the compare page


---

## 3. Rules that apply to the whole flow

Read these first. Most cases below check one of these rules.

- A **guest can add products to the bag**. Nothing in the sheet asks a guest to
  sign in.
- The **sign-in wall comes later** — at the order button inside the cart.
- **No add button adds a product straight away.** Every one of them opens the
  sheet first.
- The **price on a card is for display only.** The server decides the real
  price. The sheet, the cart and the order are the prices that count.
- The **cart lives on the server**, not in the browser. After a reload the bag
  is still there.
- The **cart icon badge** counts **lines in the bag**, not pieces. Two pieces of
  one product still show `1`.
- The **sheet is the same on every surface.** Section 5 is the full list. Later
  sections only say what is different.

---

## 4. The Buy corner on a product card (home page)

### HB-1 — The Buy corner is on the product cards
1. Open the home page.
2. Look at the cards in **Featured Products** and **Flash Deals**.
3. **Expected:** each card has a small **Buy** label with a bag icon in the
   bottom corner. In Arabic and Kurdish it sits on the other side.

### HB-2 — The Buy corner opens the sheet, not the product page
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


### HB-5 — The boutiques row and the stories bar have no Buy corner
1. Look at the boutiques row and the stories bar at the top.
2. **Expected:** neither has a **Buy** label. Tapping them never opens the sheet.

---

## 5. The add-to-bag sheet

This is the full list. Every other surface points back here.

### AB-1 — What the sheet shows
1. Tap **Buy** on a product that has colours and sizes.
2. **Expected:** the sheet shows the product picture, the brand, the name, the
   price, a colour row, a size row, and a large purple **Add To Bag** button at
   the bottom.

### AB-2 — A colour and a size are already picked
1. Open the sheet for a product with colours and sizes.
2. **Expected:** one colour and one size are already selected.


### AB-3 — Add one piece
1. Open the sheet and press **Add To Bag**.
2. **Expected:** the bag icon moves, the button text changes to **Added To Your
   Bag** for about two seconds, and the cart badge goes up by one.

### AB-4 — Add a second piece of the same choice
1. Press **Add To Bag** again on the same colour and size.
2. **Expected:** the button now reads **Add More to Your Bag**. A round minus
   button appears on the left of the button with the quantity on it.

### AB-5 — Lower the quantity
1. With quantity 2, press the round **minus** button.
2. **Expected:** the text says **Removed From Your Bag** and the quantity drops
   to 1.

### AB-6 — Remove the last piece
1. With quantity 1, press the **minus** button. The icon is now a bin.
2. **Expected:** the text says **Removed From Your Bag**, the product leaves the
   bag, and the cart badge goes down by one.

### AB-7 — Maximum quantity
1. Find a product with a maximum quantity and add it up to that number.
2. **Expected:** the button turns grey and reads **Max Allowed Quantity
   Reached**. Pressing it again shows a red message with the same words and adds
   nothing.

### AB-8 — Most products have no maximum
1. Add 3 or 4 pieces of an ordinary product.
2. **Expected:** no limit message. A maximum of `0` means "no limit".


### AB-9 — Low stock warning on a size
1. Open a product where a size has 10 pieces or fewer.
2. **Expected:** that size shows **Last N**, where N is the number left.

### AB-10 — A product with no colours and no sizes
1. Open the sheet for a product with no variants.
2. **Expected:** no colour row and no size row. If 10 pieces or fewer are left,
   **Last N** shows in the middle of the sheet instead.

### AB-11 — A sold-out size
1. Open a product with one size sold out and pick that size.
2. **Expected:** the size shows **Not Available Now, Stock Is Sold Out** and the
   add button is replaced by **Notify Me When Variant Is Available**.

### AB-12 — Notify me
1. Press **Notify Me When Variant Is Available**.
2. Allow notifications when the browser asks.
3. **Expected:** the text changes to **We Will Inform You When Variant Is
   Available**.

### AB-13 — Notify me twice
1. Press the notify button again while it already says you will be told.
2. **Expected:** a green message: *You will be notified for this product
   already*.

### AB-14 — Notify me with notifications blocked
1. Block notifications in the browser, then press the notify button.
2. **Expected:** a red message: *Notification Is Not Enabled! please Allow
   Notification Access*.

### AB-16 — A product blocked in your country
1. Open the sheet for a product that is not sold in your country, or one the
   seller has switched off.
2. **Expected:** the notify button shows instead of the add button, even when
   stock is left.

### AB-17 — A "packed after ordering" product
1. Open the sheet for a product that is packed only after the order is placed.
2. **Expected:** no **Last N** line and no sold-out line. The notify button never
   replaces the add button.

### AB-18 — Close the sheet, three ways
1. Open the sheet. Tap the dark area above it.
2. Open it again. Press the **Esc** key.
3. Open it again. Drag the small grey bar at the top of the sheet downwards.
4. **Expected:** every time the sheet slides down and closes, and the page under
   it is where it was.

### AB-19 — Changing the colour changes the picture and the price
1. Open a product with several colours and tap a different colour.
2. **Expected:** the picture and the price in the sheet follow the colour you
   picked.

### AB-20 — A different colour makes a new line
1. Add colour A. Then pick colour B in the same sheet and add it.
2. Open the cart.
3. **Expected:** the cart has **two rows**, not one row with quantity 2. The
   badge goes up by one for each.

### AB-21 — A different size makes a new line
1. Do AB-22 with two sizes of the same colour.
2. **Expected:** two rows again.

### AB-22 — The minus count is for the whole product
1. Add colour A once and colour B once.
2. **Expected:** the number on the minus button is **2** — it counts every piece
   of the product, across all colours and sizes.

### AB-23 — The sheet knows the bag from another surface
1. Add a product from the home page, then close the sheet.
2. Open the **same** product from a listing page or from the product page.
3. **Expected:** the button already reads **Add More to Your Bag** and the minus
   button is already there.

### AB-24 — Double-tap the add button
1. Tap **Add To Bag** twice very fast.
2. **Expected:** only one piece is added. The button dims while the request runs
   and ignores the second tap.

### AB-25 — Network failure while adding
1. Turn off the network, open the sheet and press **Add To Bag**.
2. **Expected:** the app does not crash and no piece is added. The quantity on
   the button goes back to what it was.

---

## 6. Luck and flash-deal cards

These cards have extra logic. Test them on their own.

### LK-1 — A luck card looks different
1. Find a card with an **orange border** and an orange label on top reading
   **Luck! Add To Bag Within N seconds**.
2. **Expected:** the Buy corner shows an orange price and a countdown like
   `-42s`, next to the word **Buy**.

### LK-2 — The countdown runs
1. Watch the number for ten seconds.
2. **Expected:** it goes down by one every second. It starts at 50.

### LK-3 — The countdown stops when you are not looking
1. Note the number, switch to another browser tab for 15 seconds, come back.
2. **Expected:** the number carried on from about where you left it. It did not
   lose the 15 seconds.

### LK-4 — The countdown stops when the card is off screen
1. Note the number, scroll the card far out of view for 15 seconds, scroll back.
2. **Expected:** the same as LK-3 — it carried on from where it stopped.

### LK-5 — The countdown stops while the app moves page
1. Note the number, open another page in the app, come back.
2. **Expected:** it carried on from where it stopped.

### LK-6 — The same countdown on every surface
1. Note the countdown for one product on the home page.
2. Open the same product from a listing page.
3. **Expected:** both show the same number. There is one countdown per product,
   not one per card. (+- 2 seconds)

### LK-7 — The offer ends at zero
1. Let a countdown reach 0 without adding the product.
2. **Expected:** the orange label and the orange price go away. The normal price
   comes back. The card keeps working as a normal card.

### LK-8 — Adding ends the offer at once
1. Open the sheet for a luck product while the countdown is still running and
   press **Add To Bag**.
2. **Expected:** the product goes into the bag at the luck price. The orange
   label and countdown for that card go away straight away.

### LK-9 — A used offer does not come back
1. After LK-7 or LK-8, reload the page.
2. **Expected:** that product shows the normal price with no countdown. It stays
   this way for this browser.

### LK-10 — Only the last 5 are remembered
1. Let 6 different luck products run out.
2. Reload the page.
3. **Expected:** the app keeps a record for the **last 5** only. The oldest one
   may show its offer again. This is on purpose.

### LK-11 — A flash-deal card
1. Find a card with an orange border and a small banner showing time left.
2. **Expected:** the price on the card is the deal price. The deal runs until the
   **end of its last day**, in your own local time — not until midnight UTC.

### LK-12 — The deal price is real
1. Note the price on a flash-deal card.
2. Open the sheet, add the product, and open the cart.
3. **Expected:** the price in the sheet and in the cart match the card. If they
   do not, report it with the product name and both prices.

---

## 7. The product page

Address: `/sy-en/products/<slug>`.

The sheet behaves exactly as in **section 5**. Only the button differs.

### PD-1 — The Buy tab is in the bottom bar
1. Open any product page.
2. **Expected:** a fixed bar sits at the bottom. In its middle is a purple tab
   with a bag icon and the word **Buy**. Beside it are the like, comment, share
   and more buttons.

### PD-2 — The Buy tab opens the sheet, it does not add
1. Press the purple **Buy** tab.
2. **Expected:** the sheet slides up. Nothing is added to the bag yet. The
   address does not change.

### PD-3 — The Buy tab stays on top of the sheet
1. With the sheet open from the product page, look at the top of the sheet.
2. **Expected:** the purple **Buy** tab is still drawn above the sheet. Pressing
   it there does nothing.

### PD-4 — The page behind is locked and jumps to the top
1. Scroll down the product page, then press **Buy**.
2. **Expected:** the page behind the sheet stops scrolling and jumps back to the
   top. Only the product page does this; a Buy corner on a card does not.

### PD-5 — There is no second add button
1. Look over the whole product page.
2. **Expected:** the purple tab in the bottom bar is the only add button. There
   is no quantity stepper on the page itself.

---

## 8. Listing and category pages

Addresses: `/sy-en/filters/...`, `/sy-en/featured/...`, `/sy-en/flashDeals/...`,
`/sy-en/categories/<slug>`.

The Buy corner and the sheet behave as in **sections 4 and 5**.

### LS-1 — Every card in the grid has a Buy corner
1. Open a listing page and scroll the grid.
2. **Expected:** every product card has the **Buy** corner, including the cards
   loaded when you scroll further down.

### LS-2 — Adding from a listing does not lose your place
1. Add a product from a card halfway down a long listing.
2. Close the sheet.
3. **Expected:** you are still at the same place in the listing. The page did not
   jump to the top and did not reload.

### LS-3 — The category home page
1. Open `/sy-en/categories/<slug>`.
2. **Expected:** rows of cards with the same Buy corners, not a full grid. There
   is **no** recommended products row here — that row is only on `/sy-en`.

### LS-4 — The flash deals listing
1. Open `/sy-en/flashDeals`.
2. **Expected:** the cards show deal prices and the Buy corner works as on the
   home page.


---

## 9. Search

### SR-1 — Search results have no Buy corner
1. Open the search and type a product name.
2. **Expected:** the results in the drop-down show the picture, the name and the
   price. There is **no** Buy label on them.

### SR-2 — A search result opens the product page
1. Tap a product in the search results.
2. **Expected:** the product page opens. Add from there with the Buy tab (PD-2).

### SR-3 — Searching inside a listing
1. Open a listing page and use the search box on it.
2. **Expected:** the page becomes a normal listing of results, and those cards
   **do** have the Buy corner.

---

## 10. Related products on the product page

### RP-1 — The related row has Buy corners
1. Open a product page and scroll to the related products row.
2. **Expected:** those cards have the same **Buy** corner as any other card.

### RP-2 — Adding from the related row
1. Press **Buy** on a related product.
2. **Expected:** the sheet opens for **that** product, not the one whose page you
   are on. Check the name and picture in the sheet.

### RP-3 — More related products load as you scroll
1. Keep scrolling the related products.
2. **Expected:** the new cards also have a working Buy corner.

---


## 11. The cart

### CT-1 — Open the cart
1. Add one product from any surface.
2. Press the **cart icon** at the top of the page.
3. **Expected:** the cart opens over the page, and the address gains `?cart=true`.

### CT-2 — Open the cart straight from a link
1. Copy the address with `?cart=true` and open it in a new tab.
2. **Expected:** the page loads with the cart already open.

### CT-3 — The badge counts lines
1. Add 3 pieces of one product and 1 piece of another.
2. **Expected:** the badge shows **2**, not 4.

### CT-4 — What a cart row shows
1. Open the cart with a product that has a colour and a size.
2. **Expected:** the row shows the picture, the name, the price, the colour, the
   size, the quantity, and the shipping days.

### CT-5 — Empty cart
1. Remove everything from the cart.
2. **Expected:** the cart shows a grey bag icon, **Cart is Empty**, and a line
   below inviting you to look at the offers.

### CT-6 — The bag survives a reload
1. Add two products, then reload the page (F5).
2. Open the cart.
3. **Expected:** both products are still there, with the same quantities.

### CT-7 — The bag survives for a guest too
1. Do CT-6 in a private window, without signing in.
2. **Expected:** the bag is still there after the reload.

### CT-8 — The bag follows you between surfaces
1. Add a product on the home page, then open a listing page and a product page.
2. **Expected:** the badge shows the same number everywhere.

### CT-9 — Browser back closes the cart
1. Open the cart, then press the browser **back** button.
2. **Expected:** the cart closes and you are back on the page under it. You are
   not sent somewhere else.

### CT-10 — An out-of-stock item is marked
1. Put a product in the bag, then have it made unavailable.
2. Open the cart.
3. **Expected:** the row shows a red line: **Availabilty: Out Of Stock**.

### CT-11 — A product blocked in your country is marked the same way
1. Put a product in the bag, then switch country in the settings to one where
   that product is not sold.
2. Open the cart.
3. **Expected:** the row shows **Availabilty: Out Of Stock** too.

### CT-12 — The badge and the cart agree
1. Sign out with products in the bag, then open the cart as the new guest.
2. **Expected:** the number on the badge is exactly the number of rows the cart
   shows. Report any difference between them.

---

## 12. Guest and verified user — where they split

This is the only place the two are treated differently.

### GV-1 — A guest is stopped at the order button
1. As a **guest**, add a product from any surface.
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

### GV-4 — What happens to the two bags — 
1. Sign in as a **verified user** and put **product A** in the bag. Sign out.
2. As a **guest**, put **product B** in the bag.
3. Press the order button and verify with the **same phone number** as step 1.
4. **Expected:** the two bags merged.

### GV-5 — A dead guest session loses the bag
1. As a guest, add two products.
2. Open the browser tools, go to **Application → Cookies**, and delete both
   **`MARKET-TOKEN`** and **`MARKET-REFRESH-TOKEN`**.
3. Reload the page and open the cart.
4. **Expected:** the bag is **empty**. The app could not renew the guest session,
   so it made a **new guest**. 

### GV-6 — An empty bag closes the cart
1. With an empty bag, press the Bottom button.
2. **Expected:** the cart closes. No checkout opens.

### GV-7 — An unavailable product blocks the way
1. Put an out-of-stock product in the bag and press the order button.
2. **Expected:** a red message: *Please Review Your Cart Some Products Not
   Available*. The checkout does not open.

### GV-8 — The bag is read again at the order button
1. Add a product. Have it made unavailable while the cart is still open.
2. Press the order button.
3. **Expected:** the app reads the bag from the server again and stops you, even
   though the row looked fine a second earlier.

---

## 13. Checkout — address and payment

### CO-1 — The confirm button starts grey
1. Open the checkout with no address saved and no payment picked.
2. **Expected:** the **Confirm Shipping & Payment** button is grey and does
   nothing.

### CO-2 — No address
1. Press the grey confirm button with no address saved.
2. **Expected:** a red message: *Please Select an Address*, and the address block
   shakes.

### CO-3 — No payment method
1. Save an address but pick no payment method, then press confirm.
2. **Expected:** the payment block shakes. No message is needed. Nothing opens.

### CO-4 — Add an address, empty fields
1. Open the address form and press **Add & Save** with the fields empty.
2. **Expected:** the form does not save. The first missing field shakes.

### CO-5 — The fields are checked in order
1. Fill in the user name only, then press **Add & Save**. Repeat, filling in one
   more field each time.
2. **Expected:** the shake moves down the form in this order: user name,
   detailed address, address title, region, recipient name, contact phone.

### CO-6 — Add an address, all fields
1. Fill in: user name, detailed address, address title, region, recipient name,
   and a phone of at least 5 characters.
2. Press **Add & Save**.
3. **Expected:** the address is saved and shows in the checkout as the delivery
   address.

### CO-7 — The alternative phone is optional
1. Save an address leaving **Alternative Phone** empty.
2. **Expected:** it saves. That field is marked **(Optional)**.

### CO-8 — Pick a payment method
1. In the payment block, tap **Cash On Delivery**.
2. **Expected:** it gets a blue border, and the shipping cost shows on it.

### CO-9 — Tap the same method again
1. Tap **Cash On Delivery** a second time.
2. **Expected:** it is unpicked. The confirm button goes grey again.

### CO-10 — Only one method at a time
1. Pick **Cash On Delivery**, then tap **Credit Cards**.
2. **Expected:** only Credit Cards stays picked.

### CO-11 — The list of methods comes from the server
1. Open the checkout in two different countries.
2. **Expected:** the methods shown may differ. Report the country and the list
   you saw; do not assume all four are always there.

### CO-13 — A full wallet takes over   (Wallet Server is Down right now and there is a clickup ticket for it)
1. Use an account whose **RDB Wallet** balance covers the whole total.
2. Open the checkout.
3. **Expected:** the wallet is picked on its own. Cash On Delivery, Credit Cards
   and Crypto turn pale and cannot be tapped.

### CO-14 — A wallet that is too small is locked (Wallet Server is Down right now and there is a clickup ticket for it)
1. Use an account whose wallet balance is **less** than the total.
2. **Expected:** the wallet row is pale and cannot be picked. The other methods
   work normally.

### CO-15 — Refresh the wallet balance (Wallet Server is Down right now and there is a clickup ticket for it)
1. Press the small refresh icon beside the wallet row.
2. **Expected:** the icon spins and the balance is read again.

### CO-16 — A discount coupon 
1. Open **I Have a Discount Coupon**, type a code, press **Apply**.
2. **Expected:** the button shows **Applying...**, then the discount shows and
   the total goes down.

### CO-17 — A wrong coupon
1. Type a code that does not exist and press **Apply**.
2. **Expected:** a message says the coupon did not work. The total does not
   change.

### CO-18 — Confirm shipping and payment
1. With an address and a payment method set, press **Confirm Shipping &
   Payment**.
2. **Expected:** the button is blue. The app reads the bag again, then moves to
   the **Place Order** step.

---

## 14. Placing the order

### OD-1 — The terms box must be ticked
1. On the Place Order step, do not tick the terms box, and press **Place Order**.
2. **Expected:** the terms row shakes. The order is not placed. The button stays
   grey.

### OD-2 — Tick the terms
1. Tick **I read and agree to the policies and terms**.
2. **Expected:** the tick shows a short spinner, the row turns pale green, and
   the **Place Order** button turns blue. (the next time you place an order the terms checkbox should be ticked/enabled by default)

### OD-3 — Place a cash-on-delivery order
1. With Cash On Delivery picked and the terms ticked, press **Place Order**.
2. **Expected:** a spinner runs, then a success screen shows **The Purchase Was
   Completed Successfully** and **Your Order Number**.

### OD-4 — The bag is emptied after a success
1. On the success screen, press **Done / Back To HomePage**.
2. **Expected:** the home page opens and the cart badge is gone. The bag is
   empty.

### OD-5 — Pay with the wallet (Wallet Server is Down right now and there is a clickup ticket for it)
1. Pick the wallet as the payment method and press **Place Order**.
2. **Expected:** a **Wallet Payment** window opens. It asks for a currency and
   shows **Amount to Pay** and **Your Balance**. **Confirm Wallet Payment**
   finishes the order.

### OD-6 — Wallet with too little money (Wallet Server is Down right now and there is a clickup ticket for it)
1. In the wallet window, try to pay more than your balance.
2. **Expected:** a red message: *Insufficient wallet balance*. Nothing is paid.

### OD-7 — Cancel the wallet window
1. Press **Cancel** in the wallet window.
2. **Expected:** the window closes, no order is placed, and you are still on the
   Place Order step.

### OD-8 — crypto sends you out (For Crypto ask Jaffar Abbass for this flow )
1. Pick **Credit Cards** or **Crypto** and place the order.
2. **Expected:** the app opens the outside payment page. Write down whether you
   come back to the app after paying, and what you see.

### OD-9 — The bag is checked one last time
1. Place an order for a product that went out of stock while you were in the
   checkout.
2. **Expected:** a red message: *Please Review Your Cart Some Products Not
   Available*, and you are sent back to the cart. No order is created.

### OD-10 — An empty bag at Place Order
1. Empty the bag in another tab, then press **Place Order**.
2. **Expected:** you are sent back to the cart. No order is created.

### OD-11 — The order appears in My Orders
1. After OD-3, open **My Account / My Orders**.
2. **Expected:** the new order is in the list, with the order number from the
   success screen.

---

## 15. What to write in a bug report

Please always give:

1. **Who** — guest or verified user.
2. **The address** you were on, for example `/sy-en/filters/...`.
3. **Which surface** you added from — home, listing, product page, boutique,
   related row, or modal.
4. **The product name**, and the colour and size you picked.
5. **The case number** from this guide, for example `AB-8`.
6. **What you expected** and **what happened**.
7. A screenshot, and the exact words of any red message.
