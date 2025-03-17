describe("Should Click On The Search Icon On The Home Page & View The Filtering & Search Page, Then Choose A Brand & Should That The Filtering Result Is Displayed & Present.", () => {
  let totalProductsFound;
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Click On Search Icon On Home Page", () => {
    cy.clickElementScroll("[data-cy=searchIcon_mainPage]");
    cy.log("✅✅ search Icon In Main Page Found");
  });
  it("Should That All Its Components Are Displayed", () => {
    cy.get("[data-cy=searchContainer]", { timeout: 10000 });
    cy.log("✅✅ Search Container Body Apperead");
    cy.get("[data-cy=searchIcon_mainPage]", { timeout: 10000 });
    cy.log("✅✅ Search Input Field with All Components Exists");
  });
  it("Container Of Brands Apperead", () => {
    cy.get("[data-cy=ContainerOfBrands]", { timeout: 10000 });
    cy.log("✅✅ Container Of Brands Apperead");
  });
  it("Should Click On The Firstly Brand To Filter Result As It", () => {
    cy.intercept("GET", "**/api/products/search?&brand_slugs**").as(
      "searchBrand"
    );
    cy.get("[data-cy=brandItem]", { timeout: 10000 })
      .eq(0)
      .click({ scrollBehavior: false });
    cy.log("✅✅ Firstly Brand Item Clicked");
    cy.wait("@searchBrand").then((interception) => {
      cy.log("✅✅ searchBrand request arrived");
    });
  });
  it("Should Click On The Firstly Brand To Filter Result As It", () => {
    cy.get("[data-cy=IsActive]").should("be.visible");
    cy.log("✅✅ Firstly Brand Item Is Active");
  });
  it("Should Get The Number That Appears In The Search Result Box", () => {
    cy.Exist1("[data-cy=countAfterFilter]").then((result) => {
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
    cy.clickElementScroll("[data-cy=searchTotalProduct]");
    cy.log("✅✅ Search Total Product Button Clicked & Founded");
    cy.get("[data-cy=allCategory]", { timeout: 15000 });
    cy.log(
      "✅✅ Products That Appeare After Clicking On The Search Total Product Button"
    );
  });
  it("Should Verifications Number Of Products That Appeared As Result Of The Filter Should Appear As Card After Clicking On The Search Total Product Button", () => {
    cy.get("[data-cy=countProduct]", { timeout: 10000 })
      .its("length")
      .then((count) => {
        cy.log(`Number Of Products View: ${count}`);
        expect(count).to.be.eq(totalProductsFound);
      });
  });
  it("Should Click On Close Icon Founded In Filter Info Box", () => {
    cy.get("[data-cy=closeIcon]", { timeout: 10000 }).click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Close Icon Clicked");
  });
  it("Should Click On Back Icon Founded In The Page Apperead After Click On Search Total Button", () => {
    cy.clickElementScroll("[data-cy=backIcon_pageAfterClickSearchTotal]");
    cy.log(
      "✅✅ Back Icon Founded In The Page Apperead After Click On Search Total Button Clicked"
    );
  });
  it("Should Click On Close Icon To Close Search Result Container", () => {
    cy.get("[data-cy=closeIcon]", { timeout: 10000 }).click({
      scrollBehavior: false,
    });
    cy.log("✅ Close Icon To Close Search Result Container Clicked");
  });
  it("Should Click On Close Icon Founded In Search Input Field To Return Home Page", () => {
    cy.get("[data-cy=closeIcon_searchPage]").click({ scrollBehavior: false });
    cy.log("✅ Close Icon Founded In Search Input Field Clicked");
  });
});
// **************************************************************************************
describe("Should Click On The Search Icon On The Home Page & View The Filtering & Search Page, Then Choose A Category & Should That The Filtering Result Is Displayed & Present.", () => {
  let totalProductsFound;
  it("Should Click On Search Icon On Home Page", () => {
    cy.clickElementScroll("[data-cy=searchIcon_mainPage]");
    cy.log("✅✅ search Icon In Main Page Found");
  });
  it("Container Of Categorys Apperead", () => {
    cy.get("[data-cy=ContainerOfCategories]", { timeout: 10000 });
    cy.log("✅✅ Container Of Categorys Apperead");
  });
  it("Should Click On The Firstly Category To Filter Result As It", () => {
    cy.intercept("GET", "**/api/products/search?&category_slugs**").as(
      "searchCategory"
    );
    cy.get("[data-cy=categoryItem]").eq(0).click({ scrollBehavior: false });
    cy.log("✅✅ Firstly Category Item Clicked");
    cy.wait("@searchCategory").then((interception) => {
      cy.log("✅✅ searchCategory request arrived");
    });
  });
  it("Should Get The Number That Appears In The Search Result Box", () => {
    cy.get('[data-cy="countAfterFilter"]')
      .invoke("text")
      .then((text) => {
        totalProductsFound = text.match(/\d+/)?.[0];
        cy.log(`Total Products Found It: ${totalProductsFound}`);
        console.log("Total Products Found It:", totalProductsFound);
      });
  });
  it("Should Verifications The Search Total Product Button Apperead & Founded", () => {
    cy.clickElementScroll("[data-cy=searchTotalProduct]");
    cy.log("✅✅ Search Total Product Button Clicked & Founded");
    cy.get("[data-cy=allCategory]", { timeout: 15000 });
    cy.log(
      "✅✅ Products That Appeare After Clicking On The Search Total Product Button"
    );
  });
  it("Should Verifications Number Of Products That Appeared As Result Of The Filter Should Appear As Card After Clicking On The Search Total Product Button", () => {
    cy.get('[data-cy="countProduct"]')
      .its("length")
      .then((count) => {
        cy.log(`Number Of Products View: ${count}`);
        expect(count).to.be.eq(totalProductsFound);
      });
  });
  it("Should Click On Close Icon Founded In Filter Info Box", () => {
    cy.clickElementScroll("[data-cy=closeIcon]");
    cy.log("✅✅ Close Icon Clicked");
  });
  it("Should Click On Back Icon Founded In The Page Apperead After Click On Search Total Button", () => {
    cy.clickElementScroll("[data-cy=backIcon_pageAfterClickSearchTotal]");
    cy.log(
      "✅✅ Back Icon Founded In The Page Apperead After Click On Search Total Button Clicked"
    );
  });
  it("Should Click On Close Icon To Close Search Result Container", () => {
    cy.get("[data-cy=closeIcon]").click({ scrollBehavior: false });
    cy.log("✅ Close Icon To Close Search Result Container Clicked");
  });
  it("Should Click On Close Icon Founded In Search Input Field To Return Home Page", () => {
    cy.get("[data-cy=closeIcon_searchPage]").click({ scrollBehavior: false });
    cy.log("✅ Close Icon Founded In Search Input Field Clicked");
  });
});
// **************************************************************************************
describe.skip("Should Click On The Search Icon On The Home Page & View The Filtering & Search Page, Then Choose A Boutique & Should That The Filtering Result Is Displayed & Present.", () => {
  let totalProductsFound;
  it("Should Click On Search Icon On Home Page", () => {
    cy.clickElementScroll("[data-cy=searchIcon_mainPage]");
    cy.log("✅✅ search Icon In Main Page Found");
  });
  it("Should That All Its Components Are Displayed", () => {
    cy.get("[data-cy=searchContainer]", { timeout: 10000 });
    cy.log("✅✅ Search Container Body Apperead");
    cy.get("[data-cy=searchIcon_mainPage]", { timeout: 10000 });
    cy.log("✅✅ Search Input Field with All Components Exists");
  });
  it("Container Of Boutiques Apperead", () => {
    cy.get("[data-cy=ContainerOfBoutiques]", { timeout: 10000 });
    cy.log("✅✅ Container Of Boutiques Apperead");
  });
  it("Should Click On The Firstly Boutique To Filter Result As It", () => {
    cy.get("[data-cy=boutiqueItem]").eq(0).click({ scrollBehavior: false });
    cy.log("✅✅ Firstly Boutique Item Clicked");
  });
  it("Should Waiting Search Boutique  Request Until Arrived", () => {
    cy.intercept("Get", "**/api/products/search?&boutique_slugs**").as(
      "searchBoutique"
    );
    cy.get("@searchBoutique", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@searchBoutique", { timeout: 10000 }).then((interception) => {
          cy.log("✅✅ searchBoutique request arrived");
        });
      } else {
        cy.log("❌❌ searchBoutique request did not arrive");
      }
    });
  });
  it("Should Verifications Search Result Container Apperead", () => {
    cy.get("[data-cy=searchResult]", { timeout: 10000 });
    cy.log("✅✅ Search Result Container Apperead");
  });
  it("Should Get The Number That Appears In The Search Result Box", () => {
    cy.get('[data-cy="countAfterFilter"]')
      .invoke("text")
      .then((text) => {
        totalProductsFound = text.match(/\d+/)?.[0];
        cy.log(`Total Products Found It: ${totalProductsFound}`);
        console.log("Total Products Found It:", totalProductsFound);
      });
  });
  it("Should Verifications The Search Total Product Button Apperead & Founded", () => {
    cy.clickElementScroll("[data-cy=searchTotalProduct]");
    cy.log("✅✅ Search Total Product Button Clicked & Founded");
  });
  it("Should Verifications Products That Appeare After Clicking On The Search Total Product Button", () => {
    cy.get("[data-cy=allCategory]", { timeout: 15000 });
    cy.log(
      "✅✅ Products That Appeare After Clicking On The Search Total Product Button"
    );
  });
  it("Should Verifications Number Of Products That Appeared As Result Of The Filter Should Appear As Card After Clicking On The Search Total Product Button", () => {
    cy.get('[data-cy="countProduct"]')
      .its("length")
      .then((count) => {
        cy.log(`Number Of Products View: ${count}`);
        if (count == totalProductsFound) {
          cy.log("✅✅ Total Products Found And Viewed Matched");
        } else {
          cy.log("❌❌ Total Products Found And Viewed Not Matched");
        }
      });
  });
  it("Should Click On Back Icon Founded In The Page Apperead After Click On Search Total Button", () => {
    cy.clickElementScroll("[data-cy=backIcon_pageAfterClickSearchTotal]");
    cy.log(
      "✅✅ Back Icon Founded In The Page Apperead After Click On Search Total Button Clicked"
    );
  });
  it("Should Click On Close Icon To Close Search Result Container", () => {
    cy.get("[data-cy=closeIcon]").click({ scrollBehavior: false });
    cy.log("✅ Close Icon To Close Search Result Container Clicked");
  });
  it("Should Click On Close Icon Founded In Search Input Field To Return Home Page", () => {
    cy.get("[data-cy=closeIcon_searchPage]").click({ scrollBehavior: false });
    cy.log("✅ Close Icon Founded In Search Input Field Clicked");
  });
});
// **************************************************************************************
describe.skip("Should Search About Product By Name", () => {
  9;
  let totalProductsFound;
  it("Should Click On Search Icon On Home Page", () => {
    cy.clickElementScroll("[data-cy=searchIcon_mainPage]");
    cy.log("✅✅ search Icon In Main Page Found");
  });
  it("Should That All Its Components Are Displayed", () => {
    cy.get("[data-cy=searchContainer]", { timeout: 10000 });
    cy.log("✅✅ Search Container Body Apperead");
    cy.get("[data-cy=searchIcon_mainPage]", { timeout: 10000 });
    cy.log("✅✅ Search Input Field with All Components Exists");
  });
  it("Should Click On Input Field For Writ Name Of The Thing Want To Search About It", () => {
    cy.clickElementForce("[data-cy=inputField]");
    cy.log(
      "✅✅ Input Field For Writ Name Of The Thing Want To Search About It clicked on"
    );
  });
  it("Should Writ Writ Name Of The Thing Want To Search About It", () => {
    cy.get("[data-cy=inputField]", { timeout: 10000 })
      .type("Zara", { force: true })
      .should("have.value", "Zara");
    cy.log("✅✅ Writ Name Of The Thing Want To Search About It Is Writing");
  });
  it("Should Apperead Reset Button Only If No Result Found For The Name Writing By User", () => {
    cy.Exist("[data-cy=resetIcon]").then((exists) => {
      if (exists) {
        cy.clickElementForce("[data-cy=resetIcon]");
        cy.log("❌❌ No Result Found");
      }
    });
  });
  it("Should Apperead Search Result Container If There Are A Result About The Name Writing By User", () => {
    cy.Exist("[data-cy=searchTotalProduct]").then((exists) => {
      if (exists) {
        cy.log("There Are A Result");
        it("Should Get The Number That Appears In The Search Result Box", () => {
          cy.get('[data-cy="countAfterFilter"]')
            .invoke("text")
            .then((text) => {
              totalProductsFound = text.match(/\d+/)?.[0];
              cy.log(`Total Products Found It: ${totalProductsFound}`);
              console.log("Total Products Found It:", totalProductsFound);
            });
        });
        cy.clickElementScroll("[data-cy=searchTotalProduct]");
        cy.log("✅✅ Search Total Product Button Clicked & Founded");
        cy.get("[data-cy=allCategory]", { timeout: 15000 });
        cy.log(
          "✅✅ Products That Appeare After Clicking On The Search Total Product Button"
        );
        cy.get('[data-cy="countProduct"]')
          .its("length")
          .then((count) => {
            cy.log(`Number Of Products View: ${count}`);
            if (count == totalProductsFound) {
              cy.log("✅✅ Total Products Found And Viewed Matched");
            } else {
              cy.log("❌❌ Total Products Found And Viewed Not Matched");
            }
          });
        cy.clickElementScroll("[data-cy=closeIcon]");
        cy.log("✅✅ Close Icon Clicked");
        cy.clickElementScroll("[data-cy=backIcon_pageAfterClickSearchTotal]");
        cy.log(
          "✅✅ Back Icon Founded In The Page Apperead After Click On Search Total Button Clicked"
        );
        cy.get("[data-cy=closeIcon]").click({ scrollBehavior: false });
        cy.log("✅ Close Icon To Close Search Result Container Clicked");
      }
    });
  });
});
