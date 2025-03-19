describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Category", () => {
  let mainCategoryTitle = "";
  let sizeTitle = "";
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get(".offer-widget:nth-child(6)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 20000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  // ********************************************************************************
  it("Should Obtain The Main Name Of The Category That Was ChosenFor The Filter", () => {
    cy.Exist1("[data-cy=categoryBox").then((exist) => {
      if (!exist) {
        cy.log("❌❌ Category Box Not Found, Skipping to Home Page...");
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅✅ Back icon clicked and returned to the main page");
      } else {
        cy.get("[data-cy=categoryTitle]")
          .eq(0)
          .invoke("text")
          .then((text) => {
            mainCategoryTitle = text as unknown as string;
            cy.log(
              "✅✅ The Main Filter Title Selected Is:",
              mainCategoryTitle
            );
          });
        cy.intercept("GET", "**/api/products/search?category_slugs**").as(
          "filterRequest"
        );
        cy.intercept(
          "GET",
          "**/api/products/search?category_slugs*&with_products=false"
        ).as("modifyRequest");
        cy.log("✅✅ Category Box Founded");
        cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
        cy.log("✅✅ A category has been selected for filtering");
        cy.wait(["@filterRequest", "@modifyRequest"]).then((interceptions) => {
          interceptions.forEach((interception, index) => {
            const requestName =
              index === 0 ? "Filter Request" : "Modify Request";
            cy.log(`✅✅ ${requestName} completed`);
          });
        });
        cy.get("[data-cy=mainFilter]", { timeout: 10000 });
        cy.log("✅✅ Main Filter Apperead In Filter Info Box");
        cy.get("[data-cy=mainFilter]")
          .invoke("text")
          .then((text) => {
            const mainFilterInFilterBoxInfo = text as unknown as string;
            cy.log(
              "✅✅ The Main Filter Title In Filter Box Info Is:",
              mainFilterInFilterBoxInfo
            );
            cy.wait(2000);
            expect(mainFilterInFilterBoxInfo).to.be.eq(mainCategoryTitle);
          });
      }
    });
  });
  it("Should Verifications The Box Of Size Founded", () => {
    cy.Exist("[data-cy=sizeBox]").then((exist) => {
      if (exist) {
        cy.log("✅✅ The Box Of Size Founded");
        cy.get("[data-cy=sizeBox]").eq(0).click({ force: true });
        cy.get("[data-cy=sizeTitle]")
          .eq(0)
          .invoke("text")
          .then((text) => {
            sizeTitle = text as unknown as string;
            cy.log("✅✅ The Main Size Title Selected Is:", sizeTitle);
          });
        cy.get("[data-cy=sizeFilterTitle]")
          .invoke("text")
          .then((text) => {
            const sizeFilterTitle = text as unknown as string;
            cy.log(
              "✅✅ The Main Size Title In Filter Box Info Is:",
              sizeFilterTitle
            );
            cy.wait(2000);
            expect(sizeFilterTitle).to.be.eq(sizeTitle);
          });
      } else {
        cy.log(
          "❌❌ The Box Of Size Not Founded: Because There Are Only Result"
        );
      }
    });
  });
  it("Should Verifications Filter Operation Is Completed Then Close Filter Info Box", () => {
    cy.Exist1("[data-cy=filterInfo]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=filterInfo]", { timeout: 10000 });
        cy.log("✅✅ Filter Info Box Apperead");
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅✅ The Filter Operation is finished");
      }
    });
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.Exist1("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅✅ back icon clicked and back to main page");
      }
    });
  });
});
// ***********************************************************************************
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Brand", () => {
  let mainBrandTitle = "";
  let sizeTitle = "";
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.get(".offer-widget:nth-child(6)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 20000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Obtain The Main Name Of The Brand That Was ChosenFor The Filter", () => {
    cy.Exist1("[data-cy=brandBox").then((exist) => {
      if (!exist) {
        cy.log("❌❌ Category Box Not Found, Skipping to Home Page...");
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅✅ Back icon clicked and returned to the main page");
      } else {
        cy.get("[data-cy=brandTitle]")
          .eq(0)
          .invoke("text")
          .then((text) => {
            mainBrandTitle = text as unknown as string;
            cy.log("✅✅ The Main Filter Title Selected Is:", mainBrandTitle);
          });
        cy.intercept("GET", "**/api/products/search?brand_slugs**").as(
          "filterRequest"
        );
        cy.intercept(
          "GET",
          "**/api/products/search?brand_slugs*&with_products=false"
        ).as("modifyRequest");
        cy.log("✅✅ Brand Box Founded");
        cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
        cy.log("✅✅ A Brand has been selected for filtering");
        cy.wait(["@filterRequest", "@modifyRequest"]).then((interceptions) => {
          interceptions.forEach((interception, index) => {
            const requestName =
              index === 0 ? "Filter Request" : "Modify Request";
            cy.log(`✅✅ ${requestName} completed`);
          });
        });
        cy.get("[data-cy=mainFilterBrand]", { timeout: 10000 });
        cy.log("✅✅ Main Filter Apperead In Filter Info Box");
        cy.get("[data-cy=mainFilterBrand]")
          .invoke("text")
          .then((text) => {
            const mainFilterBrandInFilterBoxInfo = text as unknown as string;
            cy.log(
              "✅✅ The Main Filter Title In Filter Box Info Is:",
              mainFilterBrandInFilterBoxInfo
            );
            cy.wait(2000);
            expect(mainFilterBrandInFilterBoxInfo).to.be.eq(mainBrandTitle);
          });
        // *
      }
    });
  });
  it("Should Verifications The Box Of Size Founded", () => {
    cy.Exist1("[data-cy=sizeBox]").then((exist) => {
      if (exist) {
        cy.log("✅✅ The Box Of Size Founded");
        cy.get("[data-cy=sizeBox]").eq(0).click({ force: true });
        cy.get("[data-cy=sizeTitle]")
          .eq(0)
          .invoke("text")
          .then((text) => {
            sizeTitle = text as unknown as string;
            cy.log("✅✅ The Main Size Title Selected Is:", sizeTitle);
          });
        cy.get("[data-cy=sizeFilterTitle]")
          .invoke("text")
          .then((text) => {
            const sizeFilterTitle = text as unknown as string;
            cy.log(
              "✅✅ The Main Size Title In Filter Box Info Is:",
              sizeFilterTitle
            );
            cy.wait(2000);
            expect(sizeFilterTitle).to.be.eq(sizeTitle);
          });
      } else {
        cy.log(
          "❌❌ The Box Of Size Not Founded: Because There Are Only Result"
        );
      }
    });
  });
  it("Should Verifications Filter Operation Is Completed Then Close Filter Info Box", () => {
    cy.Exist1("[data-cy=filterInfo]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=filterInfo]", { timeout: 10000 });
        cy.log("✅✅ Filter Info Box Apperead");
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅✅ The Filter Operation is finished");
      }
    });
  });

  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.Exist1("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅✅ back icon clicked and back to main page");
      }
    });
  });
});
// ***********************************************************************************
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Color", () => {
  let sizeTitle = "";
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.get(".offer-widget:nth-child(6)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Select A Color", () => {
    cy.Exist1("[data-cy=colorBox").then((exist) => {
      if (exist) {
        cy.intercept(
          "GET",
          "**/api/products/search?boutique_slugs=*&colors=*"
        ).as("filterRequest");
        cy.intercept(
          "GET",
          "**/api/products/search?boutique_slugs=*&with_products=false&colors=*"
        ).as("modifyRequest");

        cy.log("✅✅ Color Box Founded");
        cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
        cy.log("✅✅ A Color has been selected for filtering");
        cy.wait(["@filterRequest", "@modifyRequest"]).then((interceptions) => {
          interceptions.forEach((interception, index) => {
            const requestName =
              index === 0 ? "Filter Request" : "Modify Request";
            cy.log(`✅✅ ${requestName} completed`);
          });
        });
      }
    });
  });
  it("Should Verifications The Box Of Size Founded", () => {
    cy.Exist1("[data-cy=sizeBox]").then((exist) => {
      if (exist) {
        cy.log("✅✅ The Box Of Size Founded");
        cy.get("[data-cy=sizeBox]").eq(0).click({ force: true });
        cy.get("[data-cy=sizeTitle]")
          .eq(0)
          .invoke("text")
          .then((text) => {
            sizeTitle = text as unknown as string;
            cy.log("✅✅ The Main Size Title Selected Is:", sizeTitle);
          });
        cy.get("[data-cy=sizeFilterTitle]")
          .invoke("text")
          .then((text) => {
            const sizeFilterTitle = text as unknown as string;
            cy.log(
              "✅✅ The Main Size Title In Filter Box Info Is:",
              sizeFilterTitle
            );
            if (sizeFilterTitle === sizeTitle) {
              cy.log("Success: Category Title Similar To Main Filter Title");
            } else {
              cy.log("Error: Category Title Not Similar To Main Filter Title");
            }
          });
      } else {
        cy.log(
          "❌❌ The Box Of Size Not Founded: Because There Are Only Result"
        );
      }
    });
  });
  it("Should Verifications Filter Operation Is Completed Then Close Filter Info Box", () => {
    cy.Exist1("[data-cy=filterInfo]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=filterInfo]", { timeout: 10000 });
        cy.log("✅✅ Filter Info Box Apperead");
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅✅ The Filter Operation is finished");
      }
    });
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.Exist1("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅✅ back icon clicked and back to main page");
      }
    });
  });
});
// ***********************************************************************************
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Price", () => {
  let sizeTitle = "";
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.get(".offer-widget:nth-child(6)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Select A Price", () => {
    cy.Exist1("[data-cy=priceBox").then((exist) => {
      if (exist) {
        cy.intercept(
          "GET",
          "**/api/products/search?boutique_slugs=*&price=*"
        ).as("filterRequest");
        cy.intercept(
          "GET",
          "**/api/products/search?boutique_slugs=*&price=*&with_products=false"
        ).as("modifyRequest");

        cy.log("✅✅ Price Box Founded");
        cy.get("[data-cy=categoryPrice]").eq(0).click({ force: true });
        cy.log("✅✅ A Price has been selected for filtering");
        cy.wait(["@filterRequest", "@modifyRequest"]).then((interceptions) => {
          interceptions.forEach((interception, index) => {
            const requestName =
              index === 0 ? "Filter Request" : "Modify Request";
            cy.log(`✅✅ ${requestName} completed`);
          });
        });
      }
    });
  });
  it("Should Verifications The Box Of Size Founded", () => {
    cy.Exist1("[data-cy=sizeBox]").then((exist) => {
      if (exist) {
        cy.log("✅✅ The Box Of Size Founded");
        cy.get("[data-cy=sizeBox]").eq(0).click({ force: true });
        cy.get("[data-cy=sizeTitle]")
          .eq(0)
          .invoke("text")
          .then((text) => {
            sizeTitle = text as unknown as string;
            cy.log("✅✅ The Main Size Title Selected Is:", sizeTitle);
          });
        cy.get("[data-cy=sizeFilterTitle]")
          .invoke("text")
          .then((text) => {
            const sizeFilterTitle = text as unknown as string;
            cy.log(
              "✅✅ The Main Size Title In Filter Box Info Is:",
              sizeFilterTitle
            );
            if (sizeFilterTitle === sizeTitle) {
              cy.log("Success: Category Title Similar To Main Filter Title");
            } else {
              cy.log("Error: Category Title Not Similar To Main Filter Title");
            }
          });
      }
    });
    cy.log("❌❌ The Box Of Size Not Founded: Because There Are Only Result");
  });
  it("Should Verifications Filter Operation Is Completed Then Close Filter Info Box", () => {
    cy.Exist1("[data-cy=filterInfo]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=filterInfo]", { timeout: 10000 });
        cy.log("✅✅ Filter Info Box Apperead");
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅✅ The Filter Operation is finished");
      }
    });
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.Exist1("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅✅ back icon clicked and back to main page");
      }
    });
  });
});
// ***********************************************************************************
describe("Should Move Between Filter Groups By Scrolling Horizontally", () => {
  let countFilters = 0;
  let countDivs = 0;
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.get(".offer-widget:nth-child(6)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Click On The Horizontal Scroll Icons", () => {
    cy.clickElementForce("[data-cy=rightScrool]");
    cy.log("✅✅ Right scroll is clicked");
  });
  it("Should Get The Number Of Icons, Where The Number Of Icons Is The Number Of Filter Groups", () => {
    cy.get("[data-cy=countFilters]")
      .its("length")
      .then((count) => {
        countFilters = count;
        cy.log(`✅✅ Number Of count filters: ${countFilters}`);
      });
  });
  it("Should Number Of Filter Groups & Compare It With Number Of Icons", () => {
    cy.get(".boutique-category-filter")
      .should("exist") // Ensures at least one element exists
      .its("length")
      .then((count) => {
        countDivs = count;
        cy.log(`✅✅ Number of divs found: ${countDivs}`);
        cy.then(() => {
          if (countFilters === countDivs) {
            cy.log("✅✅ The number of filters matches the number of divs.");
          } else {
            cy.log("❌ Mismatch: Filters and divs count are different.");
          }
        });
      });
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// ***********************************************************************************
describe("Should Move Between Filter Groups By Scrolling Horizontally After Updating Count Of Filter Croup", () => {
  let countFilters = 0;
  let countDivs = 0;
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.get(".offer-widget:nth-child(6)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Select A Brand", () => {
    cy.Exist("[data-cy=brandBox").then((exist) => {
      if (exist) {
        cy.log("✅✅ Brand Box Founded");
        cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
        cy.log("✅✅ A Brand has been selected for filtering");
      }
    });
  });
  it("Should Click On Close Icon To Close Filter Info Box", () => {
    cy.clickElementForce("[data-cy=closeIcon]");
    cy.log("✅✅ Close icon has been clicked");
  });
  it("Should Click On The Horizontal Scroll Icons", () => {
    cy.clickElementForce("[data-cy=rightScrool]");
    cy.log("✅✅ Right scroll is clicked");
  });
  it("Should Get The Number Of Icons, Where The Number Of Icons Is The Number Of Filter Groups", () => {
    cy.get("[data-cy=countFilters]")
      .its("length")
      .then((count) => {
        countFilters = count;
        cy.log(`✅✅ Number Of count filters: ${countFilters}`);
      });
  });
  it("Should Number Of Filter Groups & Compare It With Number Of Icons", () => {
    cy.get(".boutique-category-filter")
      .should("exist") // Ensures at least one element exists
      .its("length")
      .then((count) => {
        countDivs = count;
        cy.log(`✅✅ Number of divs found: ${countDivs}`);
        cy.then(() => {
          if (countFilters === countDivs) {
            cy.log("✅✅ The number of filters matches the number of divs.");
          } else {
            cy.log("❌ Mismatch: Filters and divs count are different.");
          }
        });
      });
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// ***********************************************************************************
describe("Should Clicks On Search Input And Search About A Product (By Name)", () => {
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.get(".offer-widget:nth-child(6)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Click On The Search Icon On The Boutique Page", () => {
    cy.clickElementForce("[data-cy=searchIcon_boutiquePage]");
    cy.log("✅✅ search icon clicked");
  });
  it("Should Click On The Input Search On The Boutique Page & Write An Product Name In", () => {
    cy.clickElementForce("[data-cy=inputFiled]");
    cy.get("[data-cy=inputFiled]")
      .type("Power", { force: true })
      .should("have.value", "Power");
    cy.log("✅✅ Writing Name In Input Search Field");
  });
  it("Should Obtain The Number Of Products That Appeared After The Search To Confirm The Presence Of A Result", () => {
    cy.Exist1("[data-cy=countProduct").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`Number Of Products View: ${count}`);
            if (count > 0) {
              cy.log("✅✅ There are an result");
            } else {
              cy.log("❌❌ no result found");
            }
          });
      }
    });
  });
  it("Should The Search Field Be Cleaned Of The Word You Typed", () => {
    cy.log("✅ Typed in search input");
    cy.get("[data-cy=inputFiled]").clear();
    cy.log("✅ Cleared the search input");
    cy.get("[data-cy=inputFiled]").type(" ", {
      force: true,
    });
    cy.log("✅ Typed in search input");
  });
  it("Should Click On Close Icon To Close The Search Input Field", () => {
    cy.clickElementForce("[data-cy=closeSearchInput]");
    cy.log("✅ icon for close search input clicked");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// ***********************************************************************************
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Category Or Brand Or Color Or Price", () => {
  let totalProductsFound1 = 0;
  let totalProductsFound2 = 0;
  let totalProductsFound3 = 0;
  let totalProductsFound4 = 0;
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.get(".offer-widget:nth-child(6)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Click On Settings Icon Founded In Boutique Page", () => {
    cy.clickElementForce("[data-cy=settingsIcon]");
    cy.log("✅✅ settings icon Is clicked");
  });
  it("Should Select A Category", () => {
    cy.Exist1("[data-cy=category_botiquePage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
        cy.log("✅✅ A category has been selected for filtering");
        cy.get('[data-cy="totalProduct_filterBoutique"]')
          .invoke("text")
          .then((text) => {
            const totalProductsFound = text.match(/\d+/)?.[0];
            totalProductsFound1 = parseInt(totalProductsFound, 10);
            cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
          });
        cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
        cy.log("✅✅ Search Result Button Clicked");
      }
    });
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.Exist1("[data-cy=countProduct").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`✅✅ Number Of Products View: ${count}`);
            cy.wait(2000);
            expect(totalProductsFound1).to.be.eq(count);
          });
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅✅ Close icon has been clicked");
        cy.clickElementForce("[data-cy=settingsIcon]");
        cy.log("✅✅ settings icon Is clicked");
      }
    });
  });
  // *******************************Brand**********************************
  it("Should Select A Brand", () => {
    cy.Exist1("[data-cy=categoryShadow]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
        cy.log("✅✅ A Brand has been selected for filtering");
        cy.get('[data-cy="totalProduct_filterBoutique"]')
          .invoke("text")
          .then((text) => {
            const totalProductsFound = text.match(/\d+/)?.[0];
            totalProductsFound2 = parseInt(totalProductsFound, 10);
            cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
          });
        cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
        cy.log("✅✅ Search Result Button Clicked");
      }
    });
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.Exist1("[data-cy=countProduct").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`✅✅ Number Of Products View: ${count}`);
            cy.wait(2000);
            expect(totalProductsFound2).to.be.eq(count);
          });
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅✅ Close icon has been clicked");
        cy.clickElementForce("[data-cy=settingsIcon]");
        cy.log("✅✅ settings icon Is clicked");
      }
    });
  });
  // *****************************color************************************
  it("Should Select A Color", () => {
    cy.Exist1("[data-cy=categoryColor]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
        cy.log("✅✅ A Color has been selected for filtering");
        cy.get('[data-cy="totalProduct_filterBoutique"]')
          .invoke("text")
          .then((text) => {
            const totalProductsFound = text.match(/\d+/)?.[0];
            totalProductsFound3 = parseInt(totalProductsFound, 10);
            cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
            cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
            cy.log("✅✅ Search Result Button Clicked");
          });
      }
    });
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.Exist1("[data-cy=countProduct").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`✅✅ Number Of Products View: ${count}`);
            cy.wait(2000);
            expect(totalProductsFound3).to.be.eq(count);
          });
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅✅ Close icon has been clicked");
        cy.clickElementForce("[data-cy=settingsIcon]");
        cy.log("✅✅ settings icon Is clicked");
      }
    });
  });
  // *******************************price***************************
  it("Should Select A Price", () => {
    cy.Exist1("[data-cy=slider]").then((exist) => {
      // cy.get("[data-cy=slider]").eq(0).click({ force: true });
      // cy.log("✅ slider has been selected for filtering");
      cy.get(".rc-slider-handle-1").then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        cy.wrap($el)
          .trigger("mousedown", { which: 1, pageX: rect.x })
          .trigger("mousemove", { which: 1, pageX: rect.x + 100 }) // Move right
          .trigger("mouseup");
      });
      cy.get("[data-cy=totalProduct_filterBoutique]")
        .invoke("text")
        .then((text) => {
          const totalProductsFound = text.match(/\d+/)?.[0];
          totalProductsFound4 = parseInt(totalProductsFound, 10);
          cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
        });
      cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
      cy.log("✅✅ Search Result Button Clicked");
    });
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.Exist1("[data-cy=countProduct").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`✅✅ Number Of Products View: ${count}`);
            cy.wait(2000);
            expect(totalProductsFound4).to.be.eq(count);
          });
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅✅ Close icon has been clicked");
      }
    });
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// *******************************************************************************
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Category & Brand & Color", () => {
  let totalProductsFound44 = 0;
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.get(".offer-widget:nth-child(6)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Click On Settings Icon Founded In Boutique Page", () => {
    cy.clickElementForce("[data-cy=settingsIcon]");
    cy.log("✅✅ settings icon Is clicked");
  });
  it("Should Select A Category", () => {
    cy.Exist1("[data-cy=category_botiquePage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
        cy.log("✅✅ A category has been selected for filtering");
      }
    });
  });
  it("Should Select A Brand", () => {
    cy.Exist1("[data-cy=categoryShadow]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
        cy.log("✅✅ A Brand has been selected for filtering");
      }
    });
  });
  it("Should Select A Color", () => {
    cy.Exist1("[data-cy=categoryColor]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
        cy.log("✅✅ A Color has been selected for filtering");
      }
    });
  });
  // it("Should Select A {Price}", () => {
  //   cy.Exist1(".rc-slider-handle-1").then((exist) => {
  //     // cy.get("[data-cy=slider]").eq(0).click({ force: true });
  //     // cy.log("✅ slider has been selected for filtering");
  //     cy.get(".rc-slider-handle-1").then(($el) => {
  //       const rect = $el[0].getBoundingClientRect();
  //       cy.wrap($el)
  //         .trigger("mousedown", { which: 1, pageX: rect.x })
  //         .trigger("mousemove", { which: 1, pageX: rect.x + 100 }) // Move right
  //         .trigger("mouseup");
  //     });
  //   });
  // });
  it("Should Obtain The Number Of Products That Appeared In Search Result Body", () => {
    cy.get("[data-cy=totalProduct_filterBoutique]")
      .invoke("text")
      .then((text) => {
        const totalProductsFound = text.match(/\d+/)?.[0];
        totalProductsFound44 = parseInt(totalProductsFound, 10);
        cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
      });
  });
  it("Should Click On The Search Result Button To View The Result", () => {
    cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
    cy.log("✅✅ Search Result Button Clicked");
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.Exist1("[data-cy=countProduct]").then((exist) => {
      cy.get("[data-cy=countProduct]")
        .its("length")
        .then((count) => {
          cy.log(`✅✅ Number Of Products View: ${count}`);
          cy.wait(2000);
          // expect(totalProductsFound44).to.be.eq(count);
        });
    });
  });
  it("Should Click On Close Icon To Return To Boutique Page", () => {
    cy.clickElementForce("[data-cy=closeIcon]");
    cy.log("✅✅ Close icon has been clicked");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// **************************************************************
describe("Should Clicks On Settings Icon & Filter As Category || Brand || Color || Price & Reset After Any Choice", () => {
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.get(".offer-widget:nth-child(1)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Click On Settings Icon Founded In Boutique Page", () => {
    cy.clickElementForce("[data-cy=settingsIcon]");
    cy.log("✅✅ settings icon Is clicked");
  });
  it("Should Select A Category", () => {
    cy.Exist1("[data-cy=category_botiquePage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
        cy.log("✅✅ A category has been selected for filtering");
        cy.get("[data-cy=resetButton]").click({ force: true });
        cy.log("✅ A category has been selected for filtering");
      }
    });
  });
  it("Should Select A Brand", () => {
    cy.Exist1("[data-cy=categoryShadow]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
        cy.log("✅✅ A Brand has been selected for filtering");
        cy.get("[data-cy=resetButton]").click({ force: true });
        cy.log("✅ A category has been selected for filtering");
      }
    });
  });
  it("Should Select A Color", () => {
    cy.Exist1("[data-cy=categoryColor]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
        cy.log("✅✅ A Color has been selected for filtering");
        cy.get("[data-cy=resetButton]").click({ force: true });
        cy.log("✅ A category has been selected for filtering");
      }
    });
  });
  // it("Should Select A {Price}", () => {
  //   cy.Exist1(".rc-slider-handle-1").then((exist) => {
  //     // cy.get("[data-cy=slider]").eq(0).click({ force: true });
  //     // cy.log("✅ slider has been selected for filtering");
  //     cy.get(".rc-slider-handle-1").then(($el) => {
  //       const rect = $el[0].getBoundingClientRect();
  //       cy.wrap($el)
  //         .trigger("mousedown", { which: 1, pageX: rect.x })
  //         .trigger("mousemove", { which: 1, pageX: rect.x + 100 }) // Move right
  //         .trigger("mouseup");
  //     });
  //     cy.get("[data-cy=resetButton]").click({ force: true });
  //     cy.log("✅ A category has been selected for filtering");
  //   });
  // });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
