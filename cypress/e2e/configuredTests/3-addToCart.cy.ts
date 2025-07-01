describe("3-1 Should add product to cart from any boutique page", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("should go to boutique page", () => {
    cy.wait(5000);
    cy.get('[data-cy="boutique_link"]')
      .first()
      .click({ force: true, scrollBehavior: false });
  });

  it("Should Add Product To Cart From boutique Page", () => {
    cy.AddProductToCartFromBoutiquePage();
  });
});
describe("3-2 Should Add Product To Cart From Any Product Page", () => {
  it("should close add to cart window", () => {
    cy.get('[data-cy="Back-Icon-AddToCart"]').click();
  });
  it("should go to product page", () => {
    cy.get('[data-cy="product_link"]').first().click({ force: true });
  });
  it("should click on add to cart Button and wait to load data", () => {
    cy.intercept("GET", "**/api/v1/web/product/likesDetails/**").as(
      "SocialDataReq"
    );
    cy.intercept("GET", "**/api/v1/web/product/qtyPriceDetails/**").as(
      "QtyPriceReq"
    );
    cy.get('[data-cy="addToCartButton"]').click({ force: true });
    cy.wait(["@SocialDataReq", "@QtyPriceReq"]).then((interception) => {
      expect(interception[0].response.statusCode).to.equal(200);
      expect(interception[1].response.statusCode).to.equal(200);
    });
    cy.Exist('[data-cy="color_slide"]').then((e) => {
      if (e) cy.get('[data-cy="color_slide"]').eq(1).click();
    });
    cy.Exist('[data-cy="size_slide"]').then((e) => {
      if (e) cy.get('[data-cy="size_slide"]').eq(1).click();
    });
    cy.intercept("POST", "**/api/v1/cart/**").as("AddToCartRequest");
    cy.get('[data-cy="addTo_cart_button"]').click();
    cy.wait("@AddToCartRequest").then((s) => {
      expect(s.response.statusCode).to.equal(200);
    });
  });
  it;
});
