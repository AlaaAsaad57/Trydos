describe("Should Click On The Search Icon On The Home Page & View The Filtering & Search Page, Then Choose A Brand & Should That The Filtering Result Is Displayed & Present.", () => {
  let totalProductsFound;
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
    cy.interceptAndWait([
      {
        method: "GET",
        url: "**/api/v1/stories/users_stories",
        alias: "users_stories",
      },
      {
        method: "GET",
        url: "**/api/products/popular-search",
        alias: "popular-search",
      },
    ]);
    cy.log("✅✅ users_stories & popular-search Requests Arrived");
  });
  it("Should Click On Search Icon On Home Page", () => {
    cy.clickElement("[data-cy=searchIcon_mainPage]");
    cy.log("✅✅ search Icon In Main Page Found");
  });
  it("Should That All Its Components Are Displayed", () => {
    cy.get("[data-cy=searchContainer]", { timeout: 10000 });
    cy.log("✅✅ Search Container Body Apperead");
    cy.get("[data-cy=searchIcon_mainPage]", { timeout: 10000 });
    cy.log("✅✅ Search Input Field with All Components Exists");
  });
  it("Should Click On The Firstly Brand To Filter Result As It", () => {
    cy.get("[data-cy=ContainerOfBrands]", { timeout: 10000 });
    cy.log("✅✅ Container Of Brands Apperead");
    cy.intercept("GET", "**/api/products/search?&brand_slugs**").as(
      "searchBrand"
    );
    cy.clickElement("[data-cy=brandItem]:eq(0)");
    cy.log("✅✅ Firstly Brand Item Clicked");
    cy.wait("@searchBrand").then((interception) => {
      cy.log("✅✅ searchBrand request arrived");
    });
    cy.get("[data-cy=IsActive]").should("be.visible");
    cy.log("✅✅ Firstly Brand Item Is Active");
  });
  it("Should Get The Number That Appears In The Search Result Box", () => {
    cy.ChexkExistElement("[data-cy=countAfterFilter]").then((result) => {
      if (result) {
        cy.get("[data-cy=countAfterFilter]", { timeout: 10000 })
          .invoke("text")
          .then((text) => {
            totalProductsFound = parseInt(
              text.match(/Total Products:\s*(\d+)/)?.[1]
            );
            expect(totalProductsFound).to.exist; // Check if the number exists
            expect(totalProductsFound).to.be.a("number"); // Check if it's a number
            expect(totalProductsFound).to.be.greaterThan(0);
            cy.log(`Total Products Found: ${totalProductsFound}`);
          });
      }
    });
  });
  it("Should Verifications The Search Total Product Button Apperead & Founded", () => {
    cy.clickElement("[data-cy=searchTotalProduct]");
    cy.log("✅✅ Search Total Product Button Clicked & Founded");
    cy.interceptAndWait([
      {
        method: "POST",
        url: "**/boutiques/listing?**",
        alias: "listing",
      },
      {
        method: "GET",
        url: "**/api/products/search?**",
        alias: "LoadallProducts",
      },
    ]);
  });
  it("Should Verifications Number Of Products That Appeared As Result Of The Filter Should Appear As Card After Clicking On The Search Total Product Button", () => {
    cy.ChexkExistElement("[data-cy=countProduct]").then((result) => {
      if (result) {
        cy.get("[data-cy=countProduct]", { timeout: 10000 })
          .its("length")
          .then((count) => {
            cy.log(`Number Of Products View: ${count}`);
            expect(count).to.be.eq(totalProductsFound);
          });
        cy.get("[data-cy=closeIcon]", { timeout: 10000 }).click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Close Icon Clicked");
      }
    });
  });
  it("Should Click On Back Icon Founded In The Page Apperead After Click On Search Total Button", () => {
    cy.clickElement("[data-cy=backIcon_pageAfterClickSearchTotal]");
    cy.log(
      "✅✅ Back Icon Founded In The Page Apperead After Click On Search Total Button Clicked"
    );
  });
  it("Should Click On Close Icon To Close Search Result Container", () => {
    cy.clickElement("[data-cy=closeIcon]");
    cy.log("✅ Close Icon To Close Search Result Container Clicked");
  });
});
// **************************************************************************************
describe("Should Click On The Search Icon On The Home Page & View The Filtering & Search Page, Then Choose A Category & Should That The Filtering Result Is Displayed & Present.", () => {
  let totalProductsFound;
  it("Should Click On The Firstly Category To Filter Result As It", () => {
    cy.get("[data-cy=ContainerOfCategories]", { timeout: 10000 });
    cy.log("✅✅ Container Of Categorys Apperead");
    cy.intercept("GET", "**/api/products/search?&category_slugs**").as(
      "searchCategory"
    );
    cy.clickElement("[data-cy=categoryItem]:eq(0)");
    cy.log("✅✅ Firstly Category Item Clicked");
    cy.wait("@searchCategory").then((interception) => {
      cy.log("✅✅ searchCategory request arrived");
    });
  });
  it("Should Get The Number That Appears In The Search Result Box", () => {
    cy.ChexkExistElement("[data-cy=countAfterFilter]").then((result) => {
      if (result) {
        cy.get("[data-cy=countAfterFilter]", { timeout: 10000 })
          .invoke("text")
          .then((text) => {
            totalProductsFound = parseInt(
              text.match(/Total Products:\s*(\d+)/)?.[1]
            );
            expect(totalProductsFound).to.exist; // Check if the number exists
            expect(totalProductsFound).to.be.a("number"); // Check if it's a number
            expect(totalProductsFound).to.be.greaterThan(0);
            cy.log(`Total Products Found: ${totalProductsFound}`);
          });
      }
    });
  });
  it("Should Verifications The Search Total Product Button Apperead & Founded", () => {
    cy.clickElement("[data-cy=searchTotalProduct]");
    cy.log("✅✅ Search Total Product Button Clicked & Founded");
    cy.interceptAndWait([
      {
        method: "POST",
        url: "**/boutiques/listing?**",
        alias: "listing",
      },
      {
        method: "GET",
        url: "**/api/products/search?**",
        alias: "LoadallProducts",
      },
    ]);
  });
  it("Should Verifications Number Of Products That Appeared As Result Of The Filter Should Appear As Card After Clicking On The Search Total Product Button", () => {
    cy.ChexkExistElement("[data-cy=countProduct]").then((result) => {
      if (result) {
        cy.get("[data-cy=countProduct]", { timeout: 10000 })
          .its("length")
          .then((count) => {
            cy.log(`Number Of Products View: ${count}`);
            expect(count).to.be.eq(totalProductsFound);
          });
        cy.get("[data-cy=closeIcon]", { timeout: 10000 }).click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Close Icon Clicked");
      }
    });
  });
  it("Should Click On Back Icon Founded In The Page Apperead After Click On Search Total Button", () => {
    cy.clickElement("[data-cy=backIcon_pageAfterClickSearchTotal]");
    cy.log(
      "✅✅ Back Icon Founded In The Page Apperead After Click On Search Total Button Clicked"
    );
  });
  it("Should Click On Close Icon To Close Search Result Container", () => {
    cy.get("[data-cy=closeIcon]").click({ scrollBehavior: false });
    cy.log("✅ Close Icon To Close Search Result Container Clicked");
  });
});
// **************************************************************************************
describe("Should Click On The Search Icon On The Home Page & View The Filtering & Search Page, Then Choose A Boutique & Should That The Filtering Result Is Displayed & Present.", () => {
  let totalProductsFound;
  it("Should Click On The Firstly Boutique To Filter Result As It", () => {
    cy.get("[data-cy=ContainerOfBoutiques]", { timeout: 10000 });
    cy.log("✅✅ Container Of Boutiques Apperead");
    cy.intercept("Get", "**/api/products/search?&boutique_slugs**").as(
      "searchBoutique"
    );
    cy.clickElement("[data-cy=boutiqueItem]:eq(0)");
    cy.log("✅✅ Firstly Boutique Item Clicked");
    cy.wait("@searchBoutique").then((interception) => {
      cy.log("✅✅ searchBoutique request arrived");
    });
  });
  it("Should Get The Number That Appears In The Search Result Box", () => {
    cy.ChexkExistElement("[data-cy=countAfterFilter]").then((result) => {
      if (result) {
        cy.get("[data-cy=countAfterFilter]", { timeout: 10000 })
          .invoke("text")
          .then((text) => {
            totalProductsFound = parseInt(
              text.match(/Total Products:\s*(\d+)/)?.[1]
            );
            expect(totalProductsFound).to.exist; // Check if the number exists
            expect(totalProductsFound).to.be.a("number"); // Check if it's a number
            expect(totalProductsFound).to.be.greaterThan(0);
            cy.log(`Total Products Found: ${totalProductsFound}`);
          });
      }
    });
  });
  it("Should Verifications The Search Total Product Button Apperead & Founded", () => {
    cy.clickElement("[data-cy=searchTotalProduct]");
    cy.log("✅✅ Search Total Product Button Clicked & Founded");
    cy.interceptAndWait([
      {
        method: "POST",
        url: "**/boutiques/listing?**",
        alias: "listing",
      },
      {
        method: "GET",
        url: "**/api/products/search?**",
        alias: "LoadallProducts",
      },
    ]);
  });
  it("Should Verifications Number Of Products That Appeared As Result Of The Filter Should Appear As Card After Clicking On The Search Total Product Button", () => {
    cy.ChexkExistElement("[data-cy=countProduct]").then((result) => {
      if (result) {
        cy.get("[data-cy=countProduct]", { timeout: 10000 })
          .its("length")
          .then((count) => {
            cy.log(`Number Of Products View: ${count}`);
            expect(count).to.be.eq(totalProductsFound);
          });
      }
    });
  });
  it("Should Click On Back Icon Founded In The Page Apperead After Click On Search Total Button", () => {
    cy.clickElement("[data-cy=backIcon_pageAfterClickSearchTotal]");
    cy.log(
      "✅✅ Back Icon Founded In The Page Apperead After Click On Search Total Button Clicked"
    );
  });
  it("Should Click On Close Icon To Close Search Result Container", () => {
    cy.get("[data-cy=closeIcon]").click({ scrollBehavior: false });
    cy.log("✅ Close Icon To Close Search Result Container Clicked");
  });
});
// **************************************************************************************
describe("Should Search About Product By Name", () => {
  let totalProductsFound;
  it("Should Click On Input Field To Write Name Of The Thing To Search", () => {
    cy.clickElement("[data-cy=inputField]");
    cy.log("✅✅ Input Field clicked for writing the search term.");
  });
  it("Should Write Name Of The Thing To Search", () => {
    cy.intercept("GET", "**/api/products/search?search_text**").as(
      "searchtext"
    );
    cy.get("[data-cy=inputField]", { timeout: 10000 })
      .type("jack", { force: true })
      .should("have.value", "jack");
    cy.log("✅✅ Writing the name of the thing to search completed.");
    cy.wait("@searchtext").then((interception) => {
      cy.log("✅✅ searchtext request arrived");
    });
  });
  it("Should Apperead Search Result Container If There Are A Result About The Name Writing By User", () => {
    cy.ChexkExistElement("[data-cy=searchTotalProduct]").then((exists) => {
      if (exists) {
        cy.get("[data-cy=countAfterFilter]", { timeout: 10000 })
          .invoke("text")
          .then((text) => {
            totalProductsFound = parseInt(
              text.match(/Total Products:\s*(\d+)/)?.[1]
            );
            expect(totalProductsFound).to.exist; // Check if the number exists
            expect(totalProductsFound).to.be.a("number"); // Check if it's a number
            expect(totalProductsFound).to.be.greaterThan(0);
            cy.log(`✅✅ Total Products Found: ${totalProductsFound}`);
          });
        cy.clickElement("[data-cy=searchTotalProduct]");
        cy.log("✅✅ Search Total Product Button Clicked & Founded");
        cy.interceptAndWait([
          {
            method: "POST",
            url: "**/boutiques/listing?**",
            alias: "listing",
          },
          {
            method: "GET",
            url: "**/api/products/search?**",
            alias: "LoadallProducts",
          },
        ]);
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`✅✅ Number Of Products View: ${count}`);
            expect(count).to.be.eq(totalProductsFound);
          });
        cy.clickElement("[data-cy=closeIcon]");
        cy.log("✅✅ Close Icon Clicked");
        cy.clickElement("[data-cy=backIcon_pageAfterClickSearchTotal]");
        cy.log(
          "✅✅ Back Icon Founded In The Page Apperead After Click On Search Total Button Clicked"
        );
        cy.get("[data-cy=closeIcon]").click({ scrollBehavior: false });
        cy.log("✅ Close Icon To Close Search Result Container Clicked");
      }
    });
  });
  it("Should Apperead Reset Button Only If No Result Found For The Name Writing By User", () => {
    cy.ChexkExistElement("[data-cy=resetIcon]").then((exists) => {
      if (exists) {
        cy.clickElement("[data-cy=resetIcon]");
        cy.log("❌❌ No Result Found");
      }
    });
  });
});
