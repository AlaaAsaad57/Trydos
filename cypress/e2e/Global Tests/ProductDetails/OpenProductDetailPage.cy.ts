describe("Should Open The Boutique Page & Move From It To A Product Page From The Boutique", () => {
  before("Should Open The Trydos & Verify Boutiques Are Loaded", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.log("✅✅ Boutiues Founded & Loaded In Main Page");
  });
  it("Should Select Any Boutique & Click On", () => {
    cy.clickElementForce(".offer-widget:nth-child(5)");
    cy.log("✅✅ An Boutique Selected & Click");
  });
  it("Should Verify Products ", () => {
    cy.get("[data-cy=boutiqueOpen]", { timeout: 20000 });
    cy.log("✅✅ The Boutique's Components Were Successfully Displayed");
    cy.get("[data-cy=boutique_top_info]", { timeout: 20000 });
    cy.log("✅✅ The Selected Boutique Page Has Opened");
    cy.verifyBoxsInBoutiquePage();
    cy.get("[data-cy=allCategory]", { timeout: 20000 });
    cy.log("✅✅ There Are Products On This Boutique Page");
  });
  it("Should Check The Components Of The Product Display Card (Product Name, Price, Purchase Button)", () => {
    cy.verifyComponentsInProductCard();
  });
});
// *************************************one*********************************************
describe("Should Open Product Page", () => {
  it("Should Choose The First Product From The Products On The Boutique Page & Open His Page", () => {
    cy.get("[data-cy=on_mouse_over_product]").eq(0).click({ force: true });
    cy.log(
      "✅✅ The Card Of The First Product Is Clicked & The Page Of Product Is Opned"
    );
  });
  it("Should Choose The First Product From The Products On The Boutique Page & Open His Page", () => {
    cy.get(".embla__slide")
      .its("length")
      .then((count) => {
        cy.log(`There Are Stories About The Product & Count It Is: ${count}`);
        if (count >= 2) {
          cy.get(".embla__slide").eq(1).click({ force: true });
          cy.log("✅✅ Secondly Stories Chooses And Clicked");
          cy.clickElementForce("[data-cy=close_stories_icon]");
          cy.log("✅✅ Close Stories Icon Clicked");
        }
      });
  });
});
// *************************************two*********************************************
describe("Read More / Read Less Button Test", () => {
  it("toggles between Read More and Read Less correctly", () => {
    cy.get(".read-more").contains("Read More").should("be.visible");
    cy.get(".read-more").contains("Read More").click();
    cy.get(".read-more").contains("Read More").should("not.exist");
    cy.get(".read-more").contains("Read Less").should("be.visible");
    cy.get(".product-details-text #details")
      .invoke("text")
      .should("not.contain", "...");
    cy.get(".read-more").contains("Read Less").click();
    cy.get(".read-more").contains("Read Less").should("not.exist");
    cy.get(".read-more").contains("Read More").should("be.visible");
    cy.get(".product-details-text #details")
      .invoke("text")
      .should("contain", "...");
  });
});
// *************************************three*********************************************
describe("Product Properties Section", () => {
  it("displays product properties correctly", () => {
    cy.get(".product-properties").should("be.visible");
    cy.get(".product-property-row").should("have.length", 3);
    cy.get(".product-property-row")
      .eq(0)
      .should("contain.text", "Good Quality Product")
      .find("svg")
      .should("exist");
    cy.get(".product-property-row")
      .eq(1)
      .should("contain.text", "Verified by trydos")
      .find("svg")
      .should("exist");
    cy.get(".product-property-row")
      .eq(2)
      .should("contain.text", "Made In Turkey")
      .find("svg")
      .should("exist");
  });
});
// *************************************four*********************************************
describe("Product Color Selection", () => {
  it("Should Display The Available Color Section", () => {
    cy.get('[data-cy="ColorsIcon"]').should("be.visible");
    cy.log("✅✅ The Colors Icon Found");
    cy.get('[data-cy="AvailableColor"]').should("be.visible");
    cy.log("✅✅ The Available Color Section Found");
    cy.get('[data-cy="AvailableColor"]').each(($el, index) => {
      cy.wrap($el).then(() => {
        cy.get(".colors-label span").each(($el) => {
          cy.wrap($el)
            .invoke("text")
            .then((text) => {
              const cleanedText = text.trim().replace(/\s+/g, " ");
              cy.log(`✅✅ Color Label Text: "${cleanedText}"`); // Print each text
            });
        });
      });
    });
  });
  it("Should Verify Swipper Photo", () => {
    cy.get('[data-cy="SwiperPhoto"]').should("be.visible");
    cy.get('[data-cy="SwiperPhoto"]').eq(0).click({ force: true });
    cy.get('[data-cy="AfterClickOnSwipperPhoto"]').should("be.visible");
  });
});
// *************************************five*********************************************
describe("Should Click On QuestionMark Component & Read InfoWindow Text", () => {
  it("Should Verify & Click On QuestionMark Component and Read InfoWindow Text", () => {
    cy.get("[data-cy=QuestionMark]").each(($el, index) => {
      cy.wrap($el)
        .click({ force: true })
        .then(() => {
          cy.get("[data-cy=InfoWindow]")
            .invoke("text")
            .then((text) => {
              cy.log(`InfoWindow ${index + 1}: ${text}`);
              cy.get("body").click(0, 0);
            });
        });
    });
    cy.get("body").click(0, 0);
  });
});
// *************************************six*********************************************
describe("Should ", () => {
  it("Should", () => {
    cy.get('[data-cy="SwiperPhoto1"]').should("be.visible");
    cy.get('[data-cy="SwiperPhoto1"]').eq(0).click({ force: true });
    cy.get('[data-cy="ActiveCaneraGallery"]').should("be.visible");
    cy.get('[data-cy="GalleryItems"]').should("be.visible");
    cy.get('[data-cy="GalleryChooseItem"]').should("be.visible");
    cy.get('[data-cy="GalleryChooseItem"]').eq(0).click({ force: true });
    cy.get('[data-cy="UserInteractions"]').should("be.visible");
    cy.get('[data-cy="CountOfUserInteractions"]').should("be.visible");
    cy.get('[data-cy="ProductsDetail&Info"]').should("be.visible");
    cy.scrollTo("bottom");
    cy.get('[data-cy="ToClose"]').click({ force: true });
  });
});
