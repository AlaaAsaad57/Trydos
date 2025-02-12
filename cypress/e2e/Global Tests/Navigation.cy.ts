// describe("Navigations Test", () => {
//   before(() => {
//     Cypress.on("uncaught:exception", (err, runnable) => {
//       // returning false here prevents Cypress from
//       // failing the test
//       return false;
//     });
// hi test
//     cy.clearAllCookies();
//     cy.Visit("/");
//     cy.get("#country").select("TR");
//     cy.wait(5000);
//   });
//   it.skip("it should visit home page and navigate to listing/filter page correctly", () => {
//     cy.wait(5000);
//     cy.get(".offer-widget:first-child")
//       .invoke("attr", "href")
//       .then((href) => {
//         const link = href;
//         cy.get(".offer-widget:first-child").click();
//         cy.wait(5000);
//         cy.url().should("contain", link);
//       });
//   });
//   it.skip("should go back to homepage from listing when click on Back Icon", () => {
//     cy.wait(5000);
//     cy.get(".back-icon").click();
//   });
//   it.skip("should go back to listing from product page when click on Back Icon", () => {
//     cy.wait(5000);
//     cy.get(".offer-widget:first-child").click();
//     cy.wait(6000);
//     cy.get(":nth-child(1) > .product-container").eq(0).click();
//     cy.wait(6000);
//     cy.get(".back-icon").click({ force: true });
//   });
//   it.skip("should filter boutiques by categories when click on categories nav item and reset filter when click on it again", () => {
//     cy.Visit("/");
//     cy.wait(5000);
//     cy.get(".home-navbar > .categories-bar-container > a")
//       .eq(0)
//       .invoke("attr", "href")
//       .then((href) => {
//         cy.get(".home-navbar > .categories-bar-container > a").eq(0).click();
//         cy.wait(9000);
//         cy.url().should("contain", href);
//         cy.get(".home-navbar > .categories-bar-container > a").eq(0).click();
//         cy.wait(9000);
//         cy.url().should("not.contain", href);
//       });
//   });
// });
