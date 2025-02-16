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
    cy.get("[data-cy=categoryNavBar]", { timeout: 10000 });
    cy.log("Nav Category Icons Founded");
  });
  it("Should Navigation Between Category Icons", () => {
    cy.get("[data-cy=categoryIcons]").then(($categoryIcons) => {
      const categoryIcons = $categoryIcons.length;
      cy.log(`✅✅ Number Of categoryIcons: ${categoryIcons}`);

      for (let index = 0; index < categoryIcons; index++) {
        cy.get("[data-cy=categoryIcons]").eq(index).click({ force: true });
        cy.log(`✅✅ categoryIcon ${index + 1} Selected`);
        cy.get("[data-cy=activeCategoryIcon]", { timeout: 15000 }).should(
          "be.visible"
        );
        cy.log("✅✅ The categoryIcon Page Selected");
        cy.clickElementForce("[data-cy=storeLogo]");
        cy.log("✅✅ Store Logo clicked and returned to the main page");
        cy.get("[data-cy=boutiques]", { timeout: 15000 }).should("be.visible");
      }
    });
  });
});
describe("Should Open The Home Page And Make Sure That The Boutiques Are Loaded. For Each Boutique, Click On It And Go From The Boutique Page To The Cart.", () => {
  it("Should Click On Each Boutique & Verify Navigation", () => {
    cy.get("[data-cy=boutiques]", { timeout: 15000 });
    cy.log("✅✅ The Main Page Loaded");
    cy.get(".offer-widget").then(($boutiques) => {
      const boutiqueCount = $boutiques.length;
      cy.log(`✅✅ Number Of Boutiques: ${boutiqueCount}`);

      for (let index = 0; index < boutiqueCount; index++) {
        cy.get(".offer-widget").eq(index).click({ force: true });
        cy.log(`✅✅ Boutique ${index + 1} Selected`);
        cy.get("[data-cy=boutique_top_info]", { timeout: 15000 }).should(
          "be.visible"
        );
        cy.log("✅✅ The Boutique Page Opened");
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅✅ Back icon clicked and returned to the main page");
        cy.get("[data-cy=boutiques]", { timeout: 15000 }).should("be.visible");
      }
    });
  });
});
