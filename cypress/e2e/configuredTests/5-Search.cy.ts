describe("5-1 Should Click On The Search Icon On The Home Page & View The Filtering & Search Page", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("should click on search icon", () => {
    cy.get("[data-cy='searchIcon_mainPage']").click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should search for a skirt", () => {
    cy.intercept("GET", "**/api/**/search**").as("searchReq");
    cy.get('[data-cy="inputField"]').type("Skirt", {
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@searchReq").then((s) => {
      expect(s.response.statusCode).to.equal(200);

      if (s.response.body.data.products?.length > 0) {
        cy.get("[data-cy='product-result-link']").first().should("be.visible");
        cy.get('[data-cy="inputField"]').type("{enter}");
        cy.wait(3000);
        cy.get('[data-cy="BackIcon_boutique"]').click({
          scrollBehavior: false,
        });
      }
    });
    cy.wait(3000);
  });
});
describe("5-2 Filtering In Search Widget", () => {
  it("should click on search icon", () => {
    cy.get("[data-cy='searchIcon_mainPage']").click({ force: true });
  });

  it("should filter on Category", () => {
    cy.intercept("GET", "**/api/**/search**").as("searchReq");
    cy.get("[data-cy=category-result]")
      .first()
      .click({ scrollBehavior: false });
    cy.wait("@searchReq").then((s) => {
      expect(s.response.statusCode).to.equal(200);
    });
    cy.get('[data-cy="reset-filters-search"]').click({ scrollBehavior: false });
    cy.wait("@searchReq").then((s) => {
      expect(s.response.statusCode).to.equal(200);
    });
  });
  it("should filter on Brand", () => {
    cy.intercept("GET", "**/api/**/search**").as("searchReq");
    cy.get("[data-cy=brand-result]").first().click({ scrollBehavior: false });
    cy.wait("@searchReq").then((s) => {
      expect(s.response.statusCode).to.equal(200);
    });
    cy.get('[data-cy="reset-filters-search"]').click({ scrollBehavior: false });
    cy.wait("@searchReq").then((s) => {
      expect(s.response.statusCode).to.equal(200);
    });
  });
  it("should filter on Boutique and go listing page", () => {
    cy.intercept("GET", "**/api/**/search**").as("searchReq");
    cy.get("[data-cy=boutique-result]")
      .first()
      .click({ scrollBehavior: false });
    cy.wait("@searchReq").then((s) => {
      expect(s.response.statusCode).to.equal(200);
    });
    cy.get('[data-cy="apply-filters-search"]').click({ scrollBehavior: false });
  });
  it("should go back to search in home page", () => {
    cy.wait(3000);
    cy.get('[data-cy="BackIcon_boutique"]').click({ scrollBehavior: false });
  });
});
describe("5-3 Search History", () => {
  it("should click on search history", () => {
    cy.get('[data-cy="searchIcon_mainPage"]').click({ scrollBehavior: false });
    cy.intercept("GET", "**/api/**/search**").as("searchReq");
    cy.get('[data-cy="search-history-option"]')
      .first()
      .invoke("text")
      .then((text) => {
        cy.get('[data-cy="search-history-option"]')
          .first()
          .click({ scrollBehavior: false });
        cy.wait("@searchReq").then((s) => {
          expect(s.response.statusCode).to.equal(200);
        });
      });
  });
});
describe("5-4 Search Trending", () => {
  it("should click on search trending", () => {
    cy.intercept("GET", "**/api/**/search**").as("searchReqClear");
    cy.get('[data-cy="inputField"]').clear();
    cy.wait("@searchReqClear");
    cy.Exist('[data-cy="search-trending-option"]').then((exist) => {
      if (exist) {
        cy.intercept("GET", "**/api/**/search**").as("searchReq");
        cy.get('[data-cy="search-trending-option"]')
          .first()
          .invoke("text")
          .then((text) => {
            cy.get('[data-cy="search-trending-option"]')
              .first()
              .click({ scrollBehavior: false });
            cy.wait("@searchReq").then((s) => {
              expect(s.response.statusCode).to.equal(200);
            });
          });
      }
    });
  });
});
