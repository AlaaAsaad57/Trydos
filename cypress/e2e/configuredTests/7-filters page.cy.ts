describe("7-1 Should go to boutique page to test filters", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("should click on boutique", () => {
    cy.get("[data-cy='boutique_link']").first().click({
      force: true,
      scrollBehavior: false,
    });
    cy.get("[data-cy='category_filter_item']").should("be.visible");
  });
  it("should click on category filter icon", () => {
    cy.Exist('[data-cy="category_filter_item"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy='category_filter_item']").first().click({
          force: true,
          scrollBehavior: false,
        });
        cy.get("[data-cy='category_filter_item']").should("be.visible");
        cy.get("[data-cy='reset_filter_button']").should("be.visible");
      }
    });
  });
  it("should click on reset filter button", () => {
    cy.Exist('[data-cy="reset_filter_button"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy='reset_filter_button']").click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
  it("should click on brand filter icon", () => {
    cy.Exist('[data-cy="brand_filter_item"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy='brand_filter_item']").first().scrollIntoView();
        cy.get("[data-cy='brand_filter_item']").first().click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
  it("should click on reset filter button", () => {
    cy.Exist('[data-cy="reset_filter_button"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy='reset_filter_button']").click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
  it("should click on color filter icon", () => {
    cy.Exist('[data-cy="color_filter_item"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy='color_filter_item']").first().scrollIntoView();

        cy.get("[data-cy='color_filter_item']").first().click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
  it("should click on reset filter button", () => {
    cy.Exist('[data-cy="reset_filter_button"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy='reset_filter_button']").click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
  it("should click on size filter icon", () => {
    cy.Exist('[data-cy="size_filter_item"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy='size_filter_item']").first().scrollIntoView();
        cy.get("[data-cy='size_filter_item']").first().click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
  it("should click on reset filter button", () => {
    cy.Exist('[data-cy="reset_filter_button"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy='reset_filter_button']").click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
  it("should click on price filter icon", () => {
    cy.Exist('[data-cy="price_filter_item"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy='price_filter_item']").first().scrollIntoView();
        cy.get("[data-cy='price_filter_item']").first().click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
  it("should click on reset filter button", () => {
    cy.Exist('[data-cy="reset_filter_button"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy='reset_filter_button']").click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
});
describe("7-2 Filtering In Filter Widget", () => {
  it("should open filters widget", () => {
    cy.intercept("GET", "**/api/**/search**").as("searchReq");
    cy.get('[data-cy="filter-widget-button"]').click({ force: true });
    cy.wait("@searchReq").then((s) => {
      expect(s.response.statusCode).to.equal(200);
    });
  });
  it("should filter on Category", () => {
    cy.intercept("GET", "**/api/**/search**").as("searchReq");
    cy.Exist('[data-cy="categories-filter-item"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy=categories-filter-item]")
          .first()
          .click({ force: true });
        cy.wait("@searchReq").then((s) => {
          expect(s.response.statusCode).to.equal(200);
        });
        cy.get('[data-cy="reset-filter-button"]').click({
          scrollBehavior: false,
        });
      }
    });
  });
  it("should filter on Brand", () => {
    cy.intercept("GET", "**/api/**/search**").as("searchReq");
    cy.Exist('[data-cy="brands-filter-item"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy=brands-filter-item]").first().click({ force: true });
        cy.wait("@searchReq").then((s) => {
          expect(s.response.statusCode).to.equal(200);
        });
        cy.get('[data-cy="reset-filter-button"]').click({
          scrollBehavior: false,
        });
      }
    });
  });
  it("should filter on colors", () => {
    cy.intercept("GET", "**/api/**/search**").as("searchReq");
    cy.Exist('[data-cy="colors-filter-item"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy=colors-filter-item]").first().click({ force: true });
        cy.wait("@searchReq").then((s) => {
          expect(s.response.statusCode).to.equal(200);
        });
        cy.get('[data-cy="reset-filter-button"]').click({
          scrollBehavior: false,
        });
      }
    });
  });
  it("should filter on size", () => {
    cy.intercept("GET", "**/api/**/search**").as("searchReq");
    cy.Exist('[data-cy="sizes-filter-item"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy=sizes-filter-item]").first().click({ force: true });
        cy.wait("@searchReq").then((s) => {
          expect(s.response.statusCode).to.equal(200);
        });
        cy.get('[data-cy="reset-filter-button"]').click({
          scrollBehavior: false,
        });
      }
    });
  });
  it("should filter on price", () => {
    cy.intercept("GET", "**/api/**/search**").as("searchReq");
    cy.Exist('[data-cy="prices-filter-item"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy=prices-filter-item]").first().click({ force: true });
        cy.wait("@searchReq").then((s) => {
          expect(s.response.statusCode).to.equal(200);
        });
        cy.get('[data-cy="reset-filter-button"]').click({
          scrollBehavior: false,
        });
      }
    });
  });
  it("should close widget", () => {
    cy.get('[data-cy="close-filter-widget-button"]').click({
      scrollBehavior: false,
    });
    cy.wait(2000);
    cy.get('[data-cy="close-filter-widget-button"]').should("not.exist");
  });
});
describe("7-3 Search for product in filters page", () => {
  it("should search for first product and should show", () => {
    cy.get('[data-cy="product_link"] .product-body [data-cy="productName"]')
      .invoke("text")
      .then((text) => {
        cy.get('[data-cy="searchIcon_boutiquePage"]').click({ force: true });
        cy.get('[data-cy="inputFiled"]').type(text.split(" ")[0]);
        cy.wait(3000);
        cy.get('[data-cy="product_link"]').should("be.visible");
      });
  });
  it("should click on reset filter button", () => {
    cy.Exist('[data-cy="reset_filter_button"]').then((exist) => {
      if (exist) {
        cy.get("[data-cy='reset_filter_button']").click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
});
