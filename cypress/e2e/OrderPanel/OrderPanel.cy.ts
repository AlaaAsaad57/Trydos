// describe("Notifications Tests", () => {
//   before("Open trydos", () => {
//     Cypress.on("uncaught:exception", (err, runnable) => {
//       return false;
//     });
//     cy.Visit("/");
//   });
//   // end- Open Website
//   it("Should logout if already logged in", () => {
//     cy.Exist("[data-cy=NavUserName]").then((exist) => {
//       if (exist) {
//         cy.logout();
//       }
//     });
//   });
//   // end- logout if already logged in
//   it("should open order panel", () => {
//     cy.openOrdersWhenLogout();
//   });
//   // end- open order panel
//   it("should verify components and no notifications appear", () => {
//     cy.get("[data-cy=order-panel]").should("exist").and("be.visible");
//     cy.get("[data-cy=order-header]").should("exist").and("be.visible");
//     cy.get("[data-cy=left-header-component]").should("exist").and("be.visible");
//     cy.get("[data-cy=left-header-component-svg]")
//       .should("exist")
//       .and("be.visible");
//     cy.get("[data-cy=left-header-component-text]")
//       .should("exist")
//       .and("be.visible")
//       .contains("Orders");
//     cy.get("[data-cy=close-button]").should("exist").and("be.visible");
//     cy.get("[data-cy=close-svg]").should("exist").and("be.visible");
//     cy.clickElement("[data-cy=close-button]");
//     cy.clickElement("[data-cy=avatar-options]");
//   });
//   // end- verify components and no orders appear
// });
// describe("When user is logged in", () => {
//   it("Should login", () => {
//     cy.performLogin();
//   });
//   // end- login
//   it("Should verify user name appears", () => {
//     cy.get("[data-cy=NavUserName]")
//       .invoke("text")
//       .then((text) => {
//         expect(text).to.eq("Abdo Hamdan");
//       });
//   });
//   // end- verify user name appears
//   it("should open notifications panel", () => {
//     cy.openOrdersWhenLogin();
//   });
//   // end- open notifications panel
//   it("should verify components in header", () => {
//     cy.get("[data-cy=order-panel]").should("exist").and("be.visible");
//     cy.get("[data-cy=order-header]").should("exist").and("be.visible");
//     cy.get("[data-cy=left-header-component]").should("exist").and("be.visible");
//     cy.get("[data-cy=left-header-component-svg]")
//       .should("exist")
//       .and("be.visible");
//     cy.get("[data-cy=left-header-component-text]")
//       .should("exist")
//       .and("be.visible")
//       .contains("Orders");
//     cy.get("[data-cy=close-button]").should("exist").and("be.visible");
//     cy.get("[data-cy=close-svg]").should("exist").and("be.visible");
//   });
//   // end- verify components in header
//   it("should verify components in body", () => {
//     cy.get("[data-cy=order-body]").should("exist").and("be.visible");
//     cy.get("[data-cy=one-order]").should("exist").and("be.visible");
//     cy.get("[data-cy=one-order]")
//       .first()
//       .within(() => {
//         // Verify header components
//         cy.get("[data-cy=one-order-header]").should("be.visible").and("exist");
//         cy.get("[data-cy=leftOne-order-header]").should("be.visible");
//         cy.get("[data-cy=leftOne-order-header-text-id]")
//           .should("be.visible")
//           .and("exist")
//           .contains("Order #");
//         cy.get("[data-cy=leftOne-order-header-date]")
//           .should("be.visible")
//           .and("exist")
//           .invoke("text")
//           .then((dateText) => {
//             // Regular expression to match the date format "MMM DD, YYYY"
//             const dateFormat =
//               /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}$/;
//             expect(dateText.trim()).to.match(dateFormat);
//           });
//         // Verify right side order statuses
//         cy.get("[data-cy=rightOne-order-header]")
//           .should("be.visible")
//           .and("exist");
//         cy.get("[data-cy=rightOne-order-header-status]")
//           .should("be.visible")
//           .and("exist")
//           .invoke("text")
//           .then((statusText) => {
//             const validStatuses = ["pending", "ready_to_shipping"];
//             expect(validStatuses).to.include(statusText.trim());
//           });
//         cy.get("[data-cy=rightOne-order-header-paymentStatus]")
//           .should("be.visible")
//           .and("exist")
//           .invoke("text")
//           .then((paymentStatusText) => {
//             expect(paymentStatusText.trim()).to.not.be.empty; // Ensure it has some content
//           });
//         cy.get("[data-cy=rightOne-order-header-paymentMethod]")
//           .should("be.visible")
//           .and("exist")
//           .invoke("text")
//           .then((paymentMethodText) => {
//             const validPaymentMethods = [
//               "cash_on_delivery",
//               "trydos Wallet",
//               "crypto",
//             ];
//             expect(validPaymentMethods).to.include(paymentMethodText.trim());
//           });
//         cy.get("[data-cy=one-order-body]").should("exist").and("be.visible");
//         cy.get("[data-cy=one-order-body-container]")
//           .should("exist")
//           .and("be.visible");
//         // Verify product image container
//         cy.get("[data-cy=one-order-body-img-container]")
//           .should("exist")
//           .and("be.visible");
//         cy.get("[data-cy=one-order-body-img]")
//           .should("exist")
//           .and("be.visible");
//         // Verify order details
//         cy.get("[data-cy=one-order-body-detail]")
//           .should("exist")
//           .and("be.visible");
//         cy.get("[data-cy=one-order-body-detailName]")
//           .should("exist")
//           .and("be.visible")
//           .and("not.be.empty");
//         cy.get("[data-cy=one-order-body-qtyCurr]")
//           .should("exist")
//           .and("be.visible");
//         // Verify total and shipping costs
//         cy.get("[data-cy=one-order-total-shiping]")
//           .should("exist")
//           .and("be.visible");
//         cy.get("[data-cy=one-order-total]").should("exist").and("be.visible");
//         cy.get("[data-cy=one-order-totalText]")
//           .should("exist")
//           .and("be.visible")
//           .contains("Total");
//         cy.get("[data-cy=one-order-totalPrice]")
//           .should("exist")
//           .and("be.visible");
//         // Shipping details may be conditional

//         cy.get("[data-cy=one-order-shiping]").should("be.visible").and("exist");
//         cy.get("[data-cy=one-order-shipingText]")
//           .should("be.visible")
//           .and("exist");
//         cy.get("[data-cy=one-order-shipingPrice]")
//           .should("be.visible")
//           .and("exist");
//         // Verify address container
//         cy.get("[data-cy=address-container]").should("exist").and("be.visible");
//         cy.get("[data-cy=address-title-text]")
//           .should("exist")
//           .and("be.visible");
//         cy.get("[data-cy=address-title-cityProvinceCountry]")
//           .should("exist")
//           .and("be.visible");
//       });
//   });
//   // end- verify components in body
//   it("Should load more orders when scrolling to the bottom", () => {
//     // Get current number of orders
//     let initialOrderCount = 0;
//     cy.get("[data-cy=one-order]").then(($orders) => {
//       initialOrderCount = $orders.length;
//     });
//     // Intercept next page of orders
//     cy.intercept("GET", "**/customer/order/list**").as("loadMoreOrders");
//     // Scroll to the bottom to trigger loading more orders
//     cy.get("[data-cy=order-body]").scrollTo("bottom");
//     // Wait for more orders to load
//     cy.wait("@loadMoreOrders");
//     // Verify that more orders are loaded or "No more orders" message is shown
//     cy.get("body").then(($body) => {
//       if ($body.find("[data-cy=noMoreOrders-container]").length > 0) {
//         cy.get("[data-cy=noMoreOrders-container]").should("be.visible");
//       } else {
//         cy.get("[data-cy=one-order]").should(
//           "have.length.greaterThan",
//           initialOrderCount
//         );
//       }
//     });
//   });
//   it("Should close the orders panel when clicking close button", () => {
//     // Click close button
//     cy.clickElement("[data-cy=close-button]");
//     // Verify panel is closed
//     cy.get("[data-cy=order-panel]").should("not.exist");
//   });
//   it("Should close the orders panel when clicking outside", () => {
//     // Open orders panel again
//     cy.clickElement("[data-cy=avatar-options]");
//     cy.clickElement("[data-cy=Orders-Icon]"); //loading-svg
//     // Verify panel is visible
//     cy.get("[data-cy=order-panel]").should("be.visible");
//     // Click outside the panel
//     cy.get("body").click(0, 0);
//     // Verify panel is closed
//     cy.get("[data-cy=order-panel]").should("not.exist");
//   });
// });
