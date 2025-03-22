// describe("Should Open The Website & Logout", () => {
//   before("Visit The Site", () => {
//     Cypress.on("uncaught:exception", (err, runnable) => {
//       return false;
//     });
//     cy.Visit("/");
//   });
//   it("Should Login Firstly", () => {
//     cy.performLogin1();
//   });
//   it("Should Visit Settings Page", () => {
//     cy.clickElement("[data-cy=Logout-ReLogout]");
//     cy.clickElement("[data-cy=Settings-Icon]");
//   });
//   it("should load and display notification settings", () => {
//     cy.wait(10000);
//     cy.get(".modal-content").should("be.visible");
//     cy.get("button").contains("Notifications Settings").should("be.visible");
//     cy.get("button").contains("Notification Test").should("be.visible");
//   });
//   it("should display subscribed topics", () => {
//     cy.get(".notifications-tab").scrollIntoView();
//     cy.get(".notifications-tab").within(() => {
//       cy.get("span")
//         .contains("Enabled Notifications Topic:")
//         .should("be.visible");
//       cy.get("ul").children().should("have.length.greaterThan", 0); // Ensure there are topics listed
//     });
//   });
//   it("should handle unsubscribe functionality", () => {
//     cy.get(".notifications-tab").scrollIntoView();
//     cy.get("ul")
//       .children()
//       .first()
//       .within(() => {
//         cy.get("button").contains("Unsubscribe").click();
//       });
//     cy.get(".notifications-tab").should("contain", "No topics subscribed."); // Check if it updates correctly
//   });
//   it("should display unsubscribed topics and allow resubscribing", () => {
//     cy.get(".notifications-tab").scrollIntoView();
//     cy.get("p").contains("Disabled Notifications Topic:").should("be.visible");
//     cy.get("ul")
//       .children()
//       .first()
//       .within(() => {
//         cy.get("button").contains("Subscribe").click();
//       });
//     cy.get(".notifications-tab").should("not.contain", "No topics subscribed.");
//   });
//   it("should toggle email notifications", () => {
//     cy.get(".preferences-tab").scrollIntoView();
//     cy.get("span").contains("Enable Email Notifications").click();
//     cy.get('input[type="checkbox"]').should("be.checked"); // Check if it's checked
//     cy.get("span").contains("Enable Email Notifications").click();
//     cy.get('input[type="checkbox"]').should("not.be.checked"); // Check if it's unchecked
//   });
//   it("should change notification frequency", () => {
//     cy.get(".preferences-tab").scrollIntoView();
//     cy.get("select").select("weekly"); // Change to weekly
//     cy.get("select").should("have.value", "weekly"); // Verify the change
//   });
//   it("should close modal on outside click", () => {
//     cy.get(".modal-overlay").click(); // Click outside the modal
//     cy.get(".modal-content").should("not.exist"); // Ensure modal is closed
//   });
//   it("should handle loading states", () => {
//     cy.get(".modal-content").should("have.class", "opacity-30 cursor-wait"); // Check loading state
//   });
//   afterEach(() => {
//     cy.get(".modal-content")
//       .should("be.visible")
//       .then(() => {
//         cy.get(".modal-overlay").click();
//       });
//   });
// });
