describe("Should Verify About NavBar & Navigation Between Category Icons", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Verify The Presence Of The Navbar For The Store Logo, And The Rest Of The Icons (Basket - Login).", () => {
    cy.get("[data-cy=NavLogo]", { timeout: 10000 });
    cy.log("Store Logo Founded");
    cy.get("[data-cy=Nav_CartIcon_LogIn]", { timeout: 10000 });
    cy.log("Rest Of The Icons (Basket - Login) Founded");
  });
  it("Should Verify About Found Of Category Icons", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.get("[data-cy=categoryNavBar]", { timeout: 20000 });
    cy.log("Nav Category Icons Founded");
  });
  it("Should Navigation Between Category Icons", () => {
    cy.wait(5000);
    cy.get("[data-cy=categoryIcons]", { timeout: 15000 }).then(
      ($categoryIcons) => {
        const categoryIcon = $categoryIcons.length;
        cy.log(`✅✅ Number Of categoryIcons: ${categoryIcon}`);

        for (let index = 0; index < categoryIcon; index++) {
          cy.get("[data-cy=categoryIcons]", { timeout: 10000 })
            .eq(index)
            .click({ force: true });
          cy.log(`✅✅ categoryIcon ${index + 1} Selected`);
          // cy.get("[data-cy=activeCategoryIcon]");
          // cy.log("✅✅ The categoryIcon Page Selected");
          cy.clickElementForce("[data-cy=storeLogo]");
          cy.log("✅✅ Store Logo clicked and returned to the main page");
          cy.get("[data-cy=boutiques]", { timeout: 15000 }).should(
            "be.visible"
          );
        }
      }
    );
    cy.get("[data-cy=boutiques]", { timeout: 15000 }).should("be.visible");
  });
});
describe("Should Open The Home Page And Make Sure That The Boutiques Are Loaded. For Each Boutique, Click On It And Go From The Boutique Page To The Cart.", () => {
  it("Should Click On Each Boutique & Verify Navigation", () => {
    cy.get("[data-cy=boutiques]", { timeout: 30000 }).should("be.visible");
    cy.log("✅✅ The Main Page Loaded");

    cy.get(".offer-widget", { timeout: 20000 }).then(($boutiques) => {
      const boutiqueCount = $boutiques.length;
      cy.log(`✅✅ Number Of Boutiques: ${boutiqueCount}`);

      for (let index = 0; index < boutiqueCount; index++) {
        cy.get(".offer-widget") // Re-query elements to prevent stale DOM reference
          .eq(index)
          .as("currentBoutique") // Store the current boutique
          .click({ force: true });
        cy.log(`✅✅ Boutique ${index + 1} Selected`);
        // Navigate back to the main page
        cy.get("[data-cy=back_icon_boutique_page]", { timeout: 20000 }).click({
          force: true,
        });
        cy.log("✅✅ Back icon clicked and returned to the main page");
        cy.get("[data-cy=boutiques]", { timeout: 30000 }).should("be.visible");
      }
    });
  });
});
