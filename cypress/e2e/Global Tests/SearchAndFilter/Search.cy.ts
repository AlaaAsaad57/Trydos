describe("open cart and view products", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.clearAllData();
    cy.Visit("/");
    cy.wait(5000);
  });
  // **************************************************************************************************
  it("should Click on the search icon on the home page and view the filtering and search page", () => {
    cy.wait(10000);
    cy.Exist("[data-cy=searchIcon_mainPage]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=searchIcon_mainPage]");
        console.log("Find search Icon Item");
        cy.log("✅ Find search Icon Item");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=searchContainer]").then((exist) => {
      if (exist) {
        console.log("Search Container Body Apperead");
        cy.log("✅ Search Container Body Apperead");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=closeIcon]");
        console.log("Find Close Icon Item");
        cy.log("✅ Find Close Icon Item");
      }
    });
    cy.wait(10000);
  });
  // **************************************************************************************
  it("should search about any brand item and view the filtering and search result", () => {
    let totalProductsFound;
    cy.wait(10000);
    cy.Exist("[data-cy=searchIcon_mainPage]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=searchIcon_mainPage]");
        console.log("Find search Icon Item");
        cy.log("✅ Find search Icon Item");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=searchContainer]").then((exist) => {
      if (exist) {
        console.log("Search Container Body Apperead");
        cy.log("✅ Search Container Body Apperead");
      }
    });
    cy.wait(10000);
    cy.intercept("GET", "/api/products/search?&brand**").as("searchBrands");
    cy.Exist("[data-cy=brandItem]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=brandItem]").eq(0).click({ scrollBehavior: false });
        console.log("Find Brand Item");
        cy.log("✅ Find Brand Item");
      }
    });
    cy.wait(10000);
    cy.wait("@searchBrands").then((interception) => {
      cy.log("✅ Intercepted request for searchBrands ");
      console.log("Intercepted request for searchBrands ");
    });
    cy.wait(10000);
    cy.Exist("[data-cy=searchResults_body]").then((exist) => {
      if (exist) {
        cy.log("✅ Search Results Body Apperead");
        console.log("Search Results Body Apperead");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=searchResult]").then((exist) => {
      if (exist) {
        cy.log("✅ Search Result Apperead");
        console.log("Search Result Apperead");
      }
    });
    cy.wait(10000);
    cy.get('[data-cy="countAfterFilter"]')
      .invoke("text")
      .then((text) => {
        totalProductsFound = text.match(/\d+/)?.[0];
        cy.log(`Total Products Found It: ${totalProductsFound}`);
        console.log("Total Products Found It:", totalProductsFound);
      });
    cy.wait(10000);
    cy.Exist("[data-cy=searchTotalProduct]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=searchTotalProduct]");
        console.log("Find Search Total Product");
        cy.log("✅ Find Search Total Product");
      }
    });
    cy.wait(10000);
    cy.get('[data-cy="countProduct"]')
      .its("length")
      .then((count) => {
        cy.log(`Number Of Products View: ${count}`);
        console.log("Total Products View:", count);
        if (count == totalProductsFound) {
          console.log("Total Products Found And Viewed Matched");
          cy.log("✅✅ Total Products Found And Viewed Matched");
        } else {
          console.log("Total Products Found And Viewed Not Matched");
          cy.log("❌❌ Total Products Found And Viewed Not Matched");
        }
      });
    cy.wait(10000);
    cy.Exist("[data-cy=allCategory]").then((exist) => {
      if (exist) {
        console.log("The Page For Brands Founded Will Apperead");
        cy.log("✅ The Page For Brands Founded Will Apperead");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=closeIcon]");
        console.log("Close Icon in The Page For Brands Founded Will Apperead");
        cy.log("✅ Close Icon in The Page For Brands Founded Will Apperead");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=backIcon_pageAfterClickSearchTotal]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=backIcon_pageAfterClickSearchTotal]");
        console.log("Find Search Total Product");
        cy.log("✅ Find Search Total Product");
      }
    });
    cy.wait(10000);
    // *************************************************************
    cy.intercept("GET", "/api/products/search?").as("searchIconClose");
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=closeIcon]").eq(0).click({ scrollBehavior: false });
        console.log("Find Close Icon Item");
        cy.log("✅ Find Close Icon Item");
      }
    });
    cy.wait(10000);
    cy.wait("@searchIconClose").then((interception) => {
      cy.log("✅ Intercepted request for searchIconClose");
      console.log("Intercepted request for searchIconClose");
    });
    cy.wait(10000);
    //*************************************************************
    cy.Exist("[data-cy=closeIcon_searchPage]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=closeIcon_searchPage]");
        console.log("Find Close Icon Search Page Item");
        cy.log("✅ Find Close Icon Search Page Item");
      }
    });
    cy.wait(10000);
  });
  // *****************************************************************************************
  it("should search about any Category item and view the filtering and search result", () => {
    let totalProductsFound;
    cy.wait(10000);
    cy.Exist("[data-cy=searchIcon_mainPage]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=searchIcon_mainPage]");
        console.log("Find search Icon Item");
        cy.log("✅ Find search Icon Item");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=searchContainer]").then((exist) => {
      if (exist) {
        console.log("Search Container Body Apperead");
        cy.log("✅ Search Container Body Apperead");
      }
    });
    cy.wait(10000);
    cy.intercept("GET", "/api/products/search?&category**").as(
      "searchCategory"
    );
    cy.Exist("[data-cy=categoryItem]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryItem]").eq(0).click({ scrollBehavior: false });
        console.log("Find Category Item");
        cy.log("✅ Find Category Item");
      }
    });
    cy.wait(10000);
    cy.wait("@searchCategory").then((interception) => {
      cy.log("✅ Intercepted request for searchCategory ");
      console.log("Intercepted request for searchCategory ");
    });
    cy.wait(10000);
    cy.Exist("[data-cy=searchResults_body]").then((exist) => {
      if (exist) {
        cy.log("✅ Search Result Body Apperead");
        console.log("Search Result Body Apperead");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=searchResult]").then((exist) => {
      if (exist) {
        cy.log("✅ Search Result  Apperead");
        console.log("Search Result Apperead");
      }
    });
    cy.wait(10000);
    cy.get('[data-cy="countAfterFilter"]')
      .invoke("text")
      .then((text) => {
        totalProductsFound = text.match(/\d+/)?.[0];
        cy.log(`Total Products Found It: ${totalProductsFound}`);
        console.log("Total Products Found It:", totalProductsFound);
      });
    cy.wait(10000);
    cy.Exist("[data-cy=searchTotalProduct]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=searchTotalProduct]");
        console.log("Find Search Total Product");
        cy.log("✅ Find Search Total Product");
      }
    });
    cy.wait(10000);
    cy.get('[data-cy="countProduct"]')
      .its("length")
      .then((count) => {
        cy.log(`Number Of Products View: ${count}`);
        console.log("Total Products View:", count);
        if (count == totalProductsFound) {
          console.log("Total Products Found And Viewed Matched");
          cy.log("✅✅ Total Products Found And Viewed Matched");
        } else {
          console.log("Total Products Found And Viewed Not Matched");
          cy.log("❌❌ Total Products Found And Viewed Not Matched");
        }
      });
    cy.wait(10000);
    cy.Exist("[data-cy=allCategory]").then((exist) => {
      if (exist) {
        console.log("The Page For Brands Founded Will Apperead");
        cy.log("✅ The Page For Brands Founded Will Apperead");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=closeIcon]");
        console.log("Close Icon in The Page For Brands Founded Will Apperead");
        cy.log("✅ Close Icon in The Page For Brands Founded Will Apperead");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=backIcon_pageAfterClickSearchTotal]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=backIcon_pageAfterClickSearchTotal]");
        console.log("Find Search Total Product");
        cy.log("✅ Find Search Total Product");
      }
    });
    cy.wait(10000);
    // *************************************************************
    cy.intercept("GET", "/api/products/search?").as("searchIconClose");
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=closeIcon]").eq(0).click({ scrollBehavior: false });
        console.log("Find Close Icon Item");
        cy.log("✅ Find Close Icon Item");
      }
    });
    cy.wait(10000);
    cy.wait("@searchIconClose").then((interception) => {
      cy.log("✅ Intercepted request for searchIconClose");
      console.log("Intercepted request for searchIconClose");
    });
    cy.wait(10000);
    // *************************************************************
    cy.Exist("[data-cy=closeIcon_searchPage]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=closeIcon_searchPage]");
        console.log("Find Close Icon Item");
        cy.log("✅ Find Close Icon Item");
      }
    });
    cy.wait(10000);
  });
  // *****************************************************************************************
  it.only("should search about any boutique and view the filtering and search result", () => {
    cy.wait(10000);
    let totalProductsFound;
    cy.Exist("[data-cy=searchIcon_mainPage]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=searchIcon_mainPage]");
        console.log("Find search Icon Item");
        cy.log("✅ Find search Icon Item");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=searchContainer]").then((exist) => {
      if (exist) {
        console.log("Search Container Body Apperead");
        cy.log("✅ Search Container Body Apperead");
      }
    });
    cy.wait(10000);
    cy.intercept("GET", "/api/products/search?&boutique**").as(
      "searchBoutique"
    );
    cy.Exist("[data-cy=boutiqueItem]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=boutiqueItem]").eq(0).click({ scrollBehavior: false });
        console.log("Find Boutique Item");
        cy.log("✅ Find Boutique Item");
      }
    });
    cy.wait(10000);
    cy.wait("@searchBoutique").then((interception) => {
      cy.log("✅ Intercepted request for searchBoutique ");
      console.log("Intercepted request for searchBoutique ");
    });
    cy.wait(10000);
    cy.Exist("[data-cy=searchResults_body]").then((exist) => {
      if (exist) {
        cy.log("✅ Search Result Body Apperead");
        console.log("Search Result Body Apperead");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=searchResult]").then((exist) => {
      if (exist) {
        cy.log("✅ Search Result  Apperead");
        console.log("Search Result Apperead");
      }
    });
    cy.wait(10000);
    cy.get('[data-cy="countAfterFilter"]')
      .invoke("text")
      .then((text) => {
        totalProductsFound = text.match(/\d+/)?.[0];
        cy.log(`Total Products Found It: ${totalProductsFound}`);
        console.log("Total Products Found It:", totalProductsFound);
      });
    cy.wait(10000);
    cy.Exist("[data-cy=searchTotalProduct]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=searchTotalProduct]");
        console.log("Find Search Total Product");
        cy.log("✅ Find Search Total Product");
      }
    });
    cy.wait(10000);
    cy.get('[data-cy="countProduct"]')
      .its("length")
      .then((count) => {
        cy.log(`Number Of Products View: ${count}`);
        console.log("Total Products View:", count);
        if (count == totalProductsFound) {
          console.log("Total Products Found And Viewed Matched");
          cy.log(" ✅✅Total Products Found And Viewed Matched");
        } else {
          console.log("Total Products Found And Viewed Not Matched");
          cy.log("❌❌ Total Products Found And Viewed Not Matched");
        }
      });
    cy.wait(10000);
    cy.Exist("[data-cy=allCategory]").then((exist) => {
      if (exist) {
        console.log("The Page For Brands Founded Will Apperead");
        cy.log("✅ The Page For Brands Founded Will Apperead");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=backIcon_pageAfterClickSearchTotal]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=backIcon_pageAfterClickSearchTotal]");
        console.log("Find Search Total Product");
        cy.log("✅ Find Search Total Product");
      }
    });
    cy.wait(10000);
    // *************************************************************
    cy.intercept("GET", "/api/products/search?").as("searchIconClose");
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=closeIcon]").eq(0).click({ scrollBehavior: false });
        console.log("Find Close Icon Item");
        cy.log("✅ Find Close Icon Item");
      }
    });
    cy.wait(10000);
    cy.wait("@searchIconClose").then((interception) => {
      cy.log("✅ Intercepted request for searchIconClose");
      console.log("Intercepted request for searchIconClose");
    });
    cy.wait(10000);
    // *************************************************************
    cy.Exist("[data-cy=closeIcon_searchPage]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=closeIcon_searchPage]");
        console.log("Find Close Icon Item");
        cy.log("✅ Find Close Icon Item");
      }
    });
    cy.wait(10000);
  });
});
