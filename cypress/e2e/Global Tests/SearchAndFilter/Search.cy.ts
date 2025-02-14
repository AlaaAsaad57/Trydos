describe("Should Click On Search Icon On Home Page & View The Filter & Search Page & Should That All Its Components Are Displayed & Retuen To Home Page", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  // **************************************************************************************************
  it("Should Click On Search Icon On Home Page", () => {
    cy.clickElementScroll("[data-cy=searchIcon_mainPage]");
    cy.log("✅✅ search Icon In Main Page Found");
  });
  it("Should That All Its Components Are Displayed", () => {
    cy.get("[data-cy=searchImageIcon]", { timeout: 10000 });
    cy.get("[data-cy=searchVoiceIcon]", { timeout: 10000 });
    cy.log("✅✅ Image & Audio Search Icons Are Present");
    cy.get("[data-cy=searchContainer]", { timeout: 10000 });
    cy.log("✅✅ Search Container Body Apperead");
  });
  it("should trigger the file input when clicking the search image icon", () => {
    cy.clickElementForce("[data-cy=SearchHistoryIcon]");
    cy.log("✅✅ Search History Icon Clicked");
    cy.get("[data-cy=SearchHistoryStatement]", { timeout: 10000 });
    cy.log("✅✅ Search History Statement Apperead");
    cy.clickElementForce("[data-cy=clearAll]");
    cy.log("✅✅ Clear All Button Clicked");
  });
  it("Should Click On Close Icon To Return To Home Page", () => {
    cy.clickElementScroll("[data-cy=closeIcon_searchPage]");
    cy.log("✅✅ Close Icon Clicked");
  });
});
// **************************************************************************************
describe("Should Click On The Search Icon On The Home Page & View The Filtering & Search Page, Then Choose A Brand & Should That The Filtering Result Is Displayed & Present.", () => {
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
  it("Container Of Brands Apperead", () => {
    cy.get("[data-cy=ContainerOfBrands]", { timeout: 10000 });
    cy.log("✅✅ Container Of Brands Apperead");
  });
  it("Should Click On The Firstly Brand To Filter Result As It", () => {
    cy.get("[data-cy=brandItem]").eq(0).click({ scrollBehavior: false });
    cy.log("✅✅ Firstly Brand Item Clicked");
  });
  it("Should Waiting Search Brand Request Until Arrived", () => {
    cy.intercept("POST", "**/api/products/search?&**").as("searchBrand");
    cy.get("@searchBrand", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@searchBrand", { timeout: 10000 }).then((interception) => {
          cy.log("✅✅ searchBrand request arrived");
        });
      } else {
        cy.log("❌❌ searchBrand request did not arrive");
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
describe("Should Click On The Search Icon On The Home Page & View The Filtering & Search Page, Then Choose A Category & Should That The Filtering Result Is Displayed & Present.", () => {
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
  it("Container Of Categorys Apperead", () => {
    cy.get("[data-cy=ContainerOfCategories]", { timeout: 10000 });
    cy.log("✅✅ Container Of Categorys Apperead");
  });
  it("Should Click On The Firstly Category To Filter Result As It", () => {
    cy.get("[data-cy=categoryItem]").eq(0).click({ scrollBehavior: false });
    cy.log("✅✅ Firstly Category Item Clicked");
  });
  it("Should Waiting Search Category Request Until Arrived", () => {
    cy.intercept("POST", "**/api/products/search?&**").as("searchCategory");
    cy.get("@searchCategory", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@searchCategory", { timeout: 10000 }).then((interception) => {
          cy.log("✅✅ searchCategory request arrived");
        });
      } else {
        cy.log("❌❌ searchCategory request did not arrive");
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
describe("Should Click On The Search Icon On The Home Page & View The Filtering & Search Page, Then Choose A Category & Should That The Filtering Result Is Displayed & Present.", () => {
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
  it("Should Click On The Firstly Category To Filter Result As It", () => {
    cy.get("[data-cy=boutiqueItem]").eq(0).click({ scrollBehavior: false });
    cy.log("✅✅ Firstly Category Item Clicked");
  });
  it("Should Waiting Search Category Request Until Arrived", () => {
    cy.intercept("POST", "**/api/products/search?&**").as("searchBoutique");
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
describe.only("Should Click On The Search Input Field & Write The Name Of Brand || Category || Boutique Wanted To Search About It", () => {
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
      }
    });
  });
  it("Should Click On Close Icon Founded In Search Input Field To Return Home Page", () => {
    cy.get("[data-cy=SearchInputCloseIcon]").click({ scrollBehavior: false });
    cy.log("✅ Close Icon Founded In Search Input Field Clicked");
  });
});
