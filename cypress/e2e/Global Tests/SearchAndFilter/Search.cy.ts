describe("open cart and view products", () => {
  let productName = "";
  let inputValue = 0;
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.clearAllData();
    cy.Visit("/");
    cy.wait(5000);
  });
  it("should search icon ", () => {
    cy.wait(10000);
    cy.Exist("[data-cy=searchIcon_mainPage]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=searchIcon_mainPage]");
        console.log("Find item");
      }
    });
    cy.wait(5000);
    cy.Exist("[data-cy=brandItem]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=brandItem]").eq(0).click({ scrollBehavior: false });
        // cy.clickElementScroll("[data-cy=brandItem]");
        console.log("Find item");
      }
    });
  });
});
