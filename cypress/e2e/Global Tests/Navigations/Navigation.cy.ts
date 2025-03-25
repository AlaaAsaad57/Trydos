describe("Should Verify About NavBar & Navigation Between Category Icons", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
    cy.url().then((url) => {
      if (url === "http://localhost:3000/tr-en") {
        cy.visit("/sy-en");
        cy.clickElement("[data-cy=countain-with]:eq(0)");
      } else {
        cy.visit("/tr-en");
        cy.clickElement("[data-cy=countain-with]:eq(0)");
      }
    });
  });
  it("Should Verify The Presence Of The Navbar For The Store Logo, And The Rest Of The Icons (Cart - Login).", () => {
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
    cy.get("[data-cy=categoryIcons]", { timeout: 15000 }).then(
      ($categoryIcons) => {
        const categoryIcon = $categoryIcons.length;
        cy.log(`✅✅ Number Of categoryIcons: ${categoryIcon}`);
        cy.get("[data-cy=categoryIcons]", { timeout: 10000 })
          .eq(0)
          .click({ force: true, scrollBehavior: false });
        cy.log(`✅✅ categoryIco Selected`);
        cy.get("[data-cy=activeCategoryIcon]");
        cy.log("✅✅ The categoryIcon Page Selected");
        cy.clickElement("[data-cy=storeLogo]");
        cy.log("✅✅ Store Logo clicked and returned to the main page");
        cy.get("[data-cy=boutiques]", { timeout: 15000 }).should("be.visible");
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
      cy.get(".offer-widget")
        .eq(0)
        .as("currentBoutique")
        .click({ force: true, scrollBehavior: false });
      cy.log(`✅✅ Boutique Selected`);
      cy.get("[data-cy=on_mouse_over_product]", { timeout: 10000 })
        .eq(0)
        .click({ force: true, scrollBehavior: false });
      cy.get("[data-cy=backIcon_productPage]", { timeout: 20000 }).click({
        force: true,
        scrollBehavior: false,
      });
      cy.get("[data-cy=back_icon_boutique_page]", { timeout: 20000 }).click({
        force: true,
        scrollBehavior: false,
      });
      cy.log("✅✅ Back icon clicked and returned to the main page");
      cy.get("[data-cy=boutiques]", { timeout: 30000 }).should("be.visible");
    });
  });
  it("Should Scroll To The Bottom Of Page And Verify The New Count Of Products Is Greater Than Old Count", () => {
    cy.get("[data-cy=boutiques]", { timeout: 30000 }).should("be.visible");
    cy.log("✅✅ The Main Page Loaded");
    cy.get(".offer-widget", { timeout: 20000 }).then(($boutiques) => {
      const initialCount = $boutiques.length;
      cy.log(`✅✅ Initial Number Of Boutiques: ${initialCount}`);
      cy.scrollTo("bottom");
      cy.get(".offer-widget", { timeout: 20000 })
        .should("have.length.greaterThan", initialCount)
        .then(($newBoutiques) => {
          const latestBoutique = $newBoutiques.last();
          cy.log(`✅✅ New Number Of Boutiques: ${$newBoutiques.length}`);
          cy.wrap(latestBoutique).scrollIntoView();
        });
    });
  });
});
