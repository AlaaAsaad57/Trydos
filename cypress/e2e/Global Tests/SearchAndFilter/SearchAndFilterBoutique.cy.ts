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
    cy.get(".offer-widget:nth-child(4)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Select A Category", () => {
    cy.Exist("[data-cy=categoryBox").then((exist) => {
      if (exist) {
        cy.log("✅✅ Category Box Founded");
        cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
        cy.log("✅✅ A category has been selected for filtering");
      }
    });
  });
  // it("Should Wait For Two Requests To arrive. The First Request: Filter Request, & The Second: Request To Modify The Filters", () => {
  //   cy.interceptAndWait([
  //     {
  //       method: "GET",
  //       url: "**/api/products/search?category_slugs**",
  //       alias: "filterRequest",
  //     },
  //     {
  //       method: "GET",
  //       url: "**/api/products/search?category_slugs*&with_products=false",
  //       alias: "modifyRequest",
  //     },
  //   ]);
  //   cy.log("✅✅ Two Requests Arrived");
  // });
  it("Should Obtain The Main Name Of The Category That Was ChosenFor The Filter", () => {
    cy.get("[data-cy=categoryTitle]")
      .eq(0)
      .invoke("text")
      .then((text) => {
        mainCategoryTitle = text as unknown as string;
        cy.log("✅✅ The Main Filter Title Selected Is:", mainCategoryTitle);
      });
  });
  it("Should Verifications The Main Title Of Filtering Is Added To Filter Box Info", () => {
    cy.get("[data-cy=mainFilter]", { timeout: 10000 });
    cy.log("✅✅ Main Filter Apperead In Filter Info Box");
  });
  it("Should Obtain The Main Name Of The Filter To Compare It With The Name Of The Category ThatWas ChosenFor The Filter", () => {
    cy.get("[data-cy=mainFilter]")
      .invoke("text")
      .then((text) => {
        const mainFilterInFilterBoxInfo = text as unknown as string;
        cy.log(
          "✅✅ The Main Filter Title In Filter Box Info Is:",
          mainFilterInFilterBoxInfo
        );
        if (mainFilterInFilterBoxInfo === mainCategoryTitle) {
          cy.log("Success: Category Title Similar To Main Filter Title");
        } else {
          cy.log("Error: Category Title Not Similar To Main Filter Title");
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
  it("Should Verifications Filter Operation Is Completed", () => {
    cy.get("[data-cy=filterInfo]", { timeout: 10000 });
    cy.log("✅✅ Filter Info Box Apperead");
  });
  it("Should Click On Close Icon To Close Filter Info Box", () => {
    cy.clickElementForce("[data-cy=closeIcon]");
    cy.log("✅✅ Close icon has been clicked");
    cy.log("✅✅ The Filter Operation is finished");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// ***********************************************************************************
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products & Search For A Specific Product", () => {
  let mainBrandTitle = "";
  let sizeTitle = "";
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get(".offer-widget:nth-child(4)").click({
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
  // it("Should Wait For Two Requests To arrive. The First Request: Filter Request, & The Second: Request To Modify The Filters", () => {
  //   cy.interceptAndWait([
  //     {
  //       method: "GET",
  //       url: "**/api/products/search?brand_slugs**",
  //       alias: "filterRequest",
  //     },
  //     {
  //       method: "GET",
  //       url: "**/api/products/search?brand_slugs*&with_products=false",
  //       alias: "modifyRequest",
  //     },
  //   ]);
  //   cy.log("✅✅ Two Requests Arrived");
  // });
  it("Should Obtain The Main Name Of The Brand That Was ChosenFor The Filter", () => {
    cy.get("[data-cy=brandTitle]")
      .eq(0)
      .invoke("text")
      .then((text) => {
        mainBrandTitle = text as unknown as string;
        cy.log("✅✅ The Main Filter Title Selected Is:", mainBrandTitle);
      });
  });
  it("Should Verifications The Main Title Of Filtering Is Added To Filter Box Info", () => {
    cy.get("[data-cy=mainFilterBrand]", { timeout: 10000 });
    cy.log("✅✅ Main Filter Apperead In Filter Info Box");
  });
  it("Should Obtain The Main Name Of The Filter To Compare It With The Name Of The Category ThatWas ChosenFor The Filter", () => {
    cy.get("[data-cy=mainFilterBrand]")
      .invoke("text")
      .then((text) => {
        const mainFilterBrandInFilterBoxInfo = text as unknown as string;
        cy.log(
          "✅✅ The Main Filter Title In Filter Box Info Is:",
          mainFilterBrandInFilterBoxInfo
        );
        if (mainFilterBrandInFilterBoxInfo === mainBrandTitle) {
          cy.log("Success: Brand Title Similar To Main Filter Title");
        } else {
          cy.log("Error: Brand Title Not Similar To Main Filter Title");
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
  it("Should Verifications Filter Operation Is Completed", () => {
    cy.get("[data-cy=filterInfo]", { timeout: 10000 });
    cy.log("✅✅ Filter Info Box Apperead");
  });
  it("Should Click On Close Icon To Close Filter Info Box", () => {
    cy.clickElementForce("[data-cy=closeIcon]");
    cy.log("✅✅ Close icon has been clicked");
    cy.log("✅✅ The Filter Operation is finished");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// ***********************************************************************************
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products & Search For A Specific Product", () => {
  let sizeTitle = "";
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get(".offer-widget:nth-child(4)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Select A Color", () => {
    cy.Exist("[data-cy=colorBox").then((exist) => {
      if (exist) {
        cy.log("✅✅ Color Box Founded");
        cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
        cy.log("✅✅ A Color has been selected for filtering");
      }
    });
  });
  // it("Should Wait For Two Requests To arrive. The First Request: Filter Request, & The Second: Request To Modify The Filters", () => {
  //   cy.interceptAndWait([
  //     {
  //       method: "GET",
  //       url: "**/api/products/search?brand_slugs**",
  //       alias: "filterRequest",
  //     },
  //     {
  //       method: "GET",
  //       url: "**/api/products/search?brand_slugs*&with_products=false",
  //       alias: "modifyRequest",
  //     },
  //   ]);
  //   cy.log("✅✅ Two Requests Arrived");
  // });

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
  it("Should Verifications Filter Operation Is Completed", () => {
    cy.get("[data-cy=filterInfo]", { timeout: 10000 });
    cy.log("✅✅ Filter Info Box Apperead");
  });
  it("Should Click On Close Icon To Close Filter Info Box", () => {
    cy.clickElementForce("[data-cy=closeIcon]");
    cy.log("✅✅ Close icon has been clicked");
    cy.log("✅✅ The Filter Operation is finished");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// ***********************************************************************************
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products & Search For A Specific Product", () => {
  let sizeTitle = "";
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get(".offer-widget:nth-child(4)").click({
      force: true,
    });
    cy.log("✅✅ An Boutiue selected");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Select A Price", () => {
    cy.Exist("[data-cy=priceBox").then((exist) => {
      if (exist) {
        cy.log("✅✅ Price Box Founded");
        cy.get("[data-cy=categoryPrice]").eq(0).click({ force: true });
        cy.log("✅✅ A Price has been selected for filtering");
      }
    });
  });
  // it("Should Wait For Two Requests To arrive. The First Request: Filter Request, & The Second: Request To Modify The Filters", () => {
  //   cy.interceptAndWait([
  //     {
  //       method: "GET",
  //       url: "**/api/products/search?brand_slugs**",
  //       alias: "filterRequest",
  //     },
  //     {
  //       method: "GET",
  //       url: "**/api/products/search?brand_slugs*&with_products=false",
  //       alias: "modifyRequest",
  //     },
  //   ]);
  //   cy.log("✅✅ Two Requests Arrived");
  // });
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
  it("Should Verifications Filter Operation Is Completed", () => {
    cy.get("[data-cy=filterInfo]", { timeout: 10000 });
    cy.log("✅✅ Filter Info Box Apperead");
  });
  it("Should Click On Close Icon To Close Filter Info Box", () => {
    cy.clickElementForce("[data-cy=closeIcon]");
    cy.log("✅✅ Close icon has been clicked");
    cy.log("✅✅ The Filter Operation is finished");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// ***********************************************************************************
describe("Should Move Between Filter Groups By Scrolling Horizontally", () => {
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get(".offer-widget:nth-child(4)").click({
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
  let countFilters = 0;
  let countDivs = 0;
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
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// ***********************************************************************************
describe("Should Move Between Filter Groups By Scrolling Horizontally After Updating Count Of Filter Croup", () => {
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get(".offer-widget:nth-child(4)").click({
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
  let countFilters = 0;
  let countDivs = 0;
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
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// ***********************************************************************************
describe("Should Clicks On Search Input And Search About A Product (By Name)", () => {
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get(".offer-widget:nth-child(4)").click({
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
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get(".offer-widget:nth-child(4)").click({
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
    cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
    cy.log("✅✅ A category has been selected for filtering");
  });
  let totalProductsFound1 = 0;
  it("Should Obtain The Number Of Products That Appeared In Search Result Body", () => {
    cy.get('[data-cy="totalProduct_filterBoutique"]')
      .invoke("text")
      .then((text) => {
        const totalProductsFound = text.match(/\d+/)?.[0];
        totalProductsFound1 = parseInt(totalProductsFound, 10);
        cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
      });
  });
  it("Should Click On The Search Result Button To View The Result", () => {
    cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
    cy.log("✅✅ Search Result Button Clicked");
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.get('[data-cy="countProduct"]')
      .its("length")
      .then((count) => {
        cy.log(`✅✅ Number Of Products View: ${count}`);
        if (totalProductsFound1 == count) {
          cy.log("✅✅ Total Products Found And Viewed Matched");
        } else {
          cy.log("❌❌ Total Products Found And Viewed Not Matched");
        }
      });
  });
  it("Should Click On Close Icon To Return To Boutique Page", () => {
    cy.clickElementForce("[data-cy=closeIcon]");
    cy.log("✅✅ Close icon has been clicked");
  });
  // *******************************Brand**********************************
  it("Should Click On Settings Icon Founded In Boutique Page", () => {
    cy.clickElementForce("[data-cy=settingsIcon]");
    cy.log("✅✅ settings icon Is clicked");
  });
  it("Should Select A Brand", () => {
    cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
    cy.log("✅✅ A Brand has been selected for filtering");
  });
  let totalProductsFound2 = 0;
  it("Should Obtain The Number Of Products That Appeared In Search Result Body", () => {
    cy.get('[data-cy="totalProduct_filterBoutique"]')
      .invoke("text")
      .then((text) => {
        const totalProductsFound = text.match(/\d+/)?.[0];
        totalProductsFound2 = parseInt(totalProductsFound, 10);
        cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
      });
  });
  it("Should Click On The Search Result Button To View The Result", () => {
    cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
    cy.log("✅✅ Search Result Button Clicked");
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.get('[data-cy="countProduct"]')
      .its("length")
      .then((count) => {
        cy.log(`✅✅ Number Of Products View: ${count}`);
        if (totalProductsFound2 == count) {
          cy.log("✅✅ Total Products Found And Viewed Matched");
        } else {
          cy.log("❌❌ Total Products Found And Viewed Not Matched");
        }
      });
  });
  it("Should Click On Close Icon To Return To Boutique Page", () => {
    cy.clickElementForce("[data-cy=closeIcon]");
    cy.log("✅✅ Close icon has been clicked");
  });
  // *****************************color************************************
  it("Should Click On Settings Icon Founded In Boutique Page", () => {
    cy.clickElementForce("[data-cy=settingsIcon]");
    cy.log("✅✅ settings icon Is clicked");
  });
  it("Should Select A Color", () => {
    cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
    cy.log("✅✅ A Color has been selected for filtering");
  });
  let totalProductsFound3 = 0;
  it("Should Obtain The Number Of Products That Appeared In Search Result Body", () => {
    cy.get('[data-cy="totalProduct_filterBoutique"]')
      .invoke("text")
      .then((text) => {
        const totalProductsFound = text.match(/\d+/)?.[0];
        totalProductsFound3 = parseInt(totalProductsFound, 10);
        cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
      });
  });
  it("Should Click On The Search Result Button To View The Result", () => {
    cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
    cy.log("✅✅ Search Result Button Clicked");
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.get('[data-cy="countProduct"]')
      .its("length")
      .then((count) => {
        cy.log(`✅✅ Number Of Products View: ${count}`);
        if (totalProductsFound3 == count) {
          cy.log("✅✅ Total Products Found And Viewed Matched");
        } else {
          cy.log("❌❌ Total Products Found And Viewed Not Matched");
        }
      });
  });
  it("Should Click On Close Icon To Return To Boutique Page", () => {
    cy.clickElementForce("[data-cy=closeIcon]");
    cy.log("✅✅ Close icon has been clicked");
  });
  // *******************************price***************************
  it("Should Click On Settings Icon Founded In Boutique Page", () => {
    cy.clickElementForce("[data-cy=settingsIcon]");
    cy.log("✅✅ settings icon Is clicked");
  });
  it("Should Select A Price", () => {
    cy.get("[data-cy=slider]").eq(0).click({ force: true });
    cy.log("✅ slider has been selected for filtering");
  });
  it("Should Moving Price Slider To Right", () => {
    cy.get(".rc-slider-handle-1").then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      cy.wrap($el)
        .trigger("mousedown", { which: 1, pageX: rect.x })
        .trigger("mousemove", { which: 1, pageX: rect.x + 100 }) // Move right
        .trigger("mouseup");
    });
  });
  let totalProductsFound4 = 0;
  it("Should Obtain The Number Of Products That Appeared In Search Result Body", () => {
    cy.get('[data-cy="totalProduct_filterBoutique"]')
      .invoke("text")
      .then((text) => {
        const totalProductsFound = text.match(/\d+/)?.[0];
        totalProductsFound4 = parseInt(totalProductsFound, 10);
        cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
      });
  });
  it("Should Click On The Search Result Button To View The Result", () => {
    cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
    cy.log("✅✅ Search Result Button Clicked");
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.get('[data-cy="countProduct"]')
      .its("length")
      .then((count) => {
        cy.log(`✅✅ Number Of Products View: ${count}`);
        if (totalProductsFound4 == count) {
          cy.log("✅✅ Total Products Found And Viewed Matched");
        } else {
          cy.log("❌❌ Total Products Found And Viewed Not Matched");
        }
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
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// *******************************************************************************
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Category & Brand & Color", () => {
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get(".offer-widget:nth-child(4)").click({
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
    cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
    cy.log("✅✅ A category has been selected for filtering");
  });
  it("Should Select A Brand", () => {
    cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
    cy.log("✅✅ A Brand has been selected for filtering");
  });
  it("Should Select A Color", () => {
    cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
    cy.log("✅✅ A Color has been selected for filtering");
  });
  let totalProductsFound4 = 0;
  it("Should Obtain The Number Of Products That Appeared In Search Result Body", () => {
    cy.get('[data-cy="totalProduct_filterBoutique"]')
      .invoke("text")
      .then((text) => {
        const totalProductsFound = text.match(/\d+/)?.[0];
        totalProductsFound4 = parseInt(totalProductsFound, 10);
        cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
      });
  });
  it("Should Click On The Search Result Button To View The Result", () => {
    cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
    cy.log("✅✅ Search Result Button Clicked");
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.get('[data-cy="countProduct"]')
      .its("length")
      .then((count) => {
        cy.log(`✅✅ Number Of Products View: ${count}`);
        if (totalProductsFound4 == count) {
          cy.log("✅✅ Total Products Found And Viewed Matched");
        } else {
          cy.log("❌❌ Total Products Found And Viewed Not Matched");
        }
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
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
// **************************************************************
describe("Should Clicks On Settings Icon & Filter As Category || Brand || Color || Price & Reset After Any Choice", () => {
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.get(".offer-widget:nth-child(4)").click({
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
    cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
    cy.log("✅✅ A category has been selected for filtering");
  });
  it("Should Click On Reset button & ReChooose The Type Of Filter", () => {
    cy.get("[data-cy=resetButton]").click({ force: true });
    cy.log("✅ A category has been selected for filtering");
  });
  it("Should Select A Brand", () => {
    cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
    cy.log("✅✅ A Brand has been selected for filtering");
  });
  it("Should Click On Reset button & ReChooose The Type Of Filter", () => {
    cy.get("[data-cy=resetButton]").click({ force: true });
    cy.log("✅ A category has been selected for filtering");
  });
  it("Should Select A Color", () => {
    cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
    cy.log("✅✅ A Color has been selected for filtering");
  });
  it("Should Click On Reset button & ReChooose The Type Of Filter", () => {
    cy.get("[data-cy=resetButton]").click({ force: true });
    cy.log("✅ A category has been selected for filtering");
  });
  it("Should Select A Price", () => {
    cy.get("[data-cy=slider]").eq(0).click({ force: true });
    cy.log("✅ slider has been selected for filtering");
  });
  it("Should Moving Price Slider To Right", () => {
    cy.get(".rc-slider-handle-1").then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      cy.wrap($el)
        .trigger("mousedown", { which: 1, pageX: rect.x })
        .trigger("mousemove", { which: 1, pageX: rect.x + 100 }) // Move right
        .trigger("mouseup");
    });
  });
  it("Should Click On Reset button & ReChooose The Type Of Filter", () => {
    cy.get("[data-cy=resetButton]").click({ force: true });
    cy.log("✅ A category has been selected for filtering");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
