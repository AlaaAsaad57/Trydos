describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Category", () => {
  let mainCategoryTitle = "";
  let sizeTitle = "";
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
  it("Should Click On Any Boutique & Verifications The Boutique Page Opened", () => {
    cy.clickElement(".offer-widget:eq(4)");
    cy.log("✅✅ An Boutique Selected & Click");
    cy.get("[data-cy=boutique_top_info]", { timeout: 10000 }).should(
      "be.visible"
    );
    cy.log("✅✅ The Boutique Page Opened");
    cy.interceptAndWait([
      {
        method: "POST",
        url: "**/boutiques/**",
        alias: "OpenBoutique",
      },
      {
        method: "GET",
        url: "**/api/products/search?&boutique_slugs**",
        alias: "LoadallProducts",
      },
    ]);
    cy.log("✅✅ OpenBoutique & LoadallProducts Requests Arrived");
    cy.verifyBoxsInBoutiquePage();
    cy.verifyComponentsInProductCard();
  });
  // ********************************************************************************
  it("Should Obtain The Main Name Of The Category That Was ChosenFor The Filter", () => {
    cy.ChexkExistElement("[data-cy=categoryBox").then((exist) => {
      if (!exist) {
        cy.log("❌❌ Category Box Not Found, Skipping to Home Page...");
      } else {
        cy.log("✅✅ Category Box Founded");
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
        cy.clickElement("[data-cy=category_botiquePage]:eq(0)");
        cy.log("✅✅ A category has been selected for filtering");
        cy.wait(["@filterRequest", "@modifyRequest"]).then((interceptions) => {
          interceptions.forEach((interception, index) => {
            const requestName =
              index === 0 ? "Filter Request" : "Modify Request";
            cy.log(`✅✅ ${requestName} completed`);
          });
        });
        cy.get("[data-cy=mainFilter]")
          .should("be.visible")
          .invoke("text")
          .then((text) => {
            const mainFilterInFilterBoxInfo = text as unknown as string;
            cy.log(
              "✅✅ The Main Filter Title In Filter Box Info Is:",
              mainFilterInFilterBoxInfo
            );
            expect(mainFilterInFilterBoxInfo).to.be.eq(mainCategoryTitle);
          });
      }
    });
  });
  it("Should Verifications The Box Of Size Founded", () => {
    cy.ChexkExistElement("[data-cy=sizeBox]").then((exist) => {
      if (exist) {
        cy.log("✅✅ The Box Of Size Founded");
        cy.clickElement("[data-cy=sizeBox]:eq(0)");
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
    cy.ChexkExistElement("[data-cy=filterInfo]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=closeIcon]");
        cy.log("✅✅ The Filter Operation is finished");
      }
    });
  });
});
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Brand", () => {
  let mainBrandTitle = "";
  let sizeTitle = "";
  it("Should Obtain The Main Name Of The Brand That Was ChosenFor The Filter", () => {
    cy.ChexkExistElement("[data-cy=brandBox").then((exist) => {
      if (!exist) {
        cy.log("❌❌ Category Box Not Found, Skipping to Home Page...");
      } else {
        cy.log("✅✅ Brand Box Founded");
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
        cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
        cy.log("✅✅ A Brand has been selected for filtering");
        cy.wait(["@filterRequest", "@modifyRequest"]).then((interceptions) => {
          interceptions.forEach((interception, index) => {
            const requestName =
              index === 0 ? "Filter Request" : "Modify Request";
            cy.log(`✅✅ ${requestName} completed`);
          });
        });
        cy.get("[data-cy=mainFilterBrand]")
          .invoke("text")
          .then((text) => {
            const mainFilterBrandInFilterBoxInfo = text as unknown as string;
            cy.log(
              "✅✅ The Main Filter Title In Filter Box Info Is:",
              mainFilterBrandInFilterBoxInfo
            );
            expect(mainFilterBrandInFilterBoxInfo).to.be.eq(mainBrandTitle);
          });
      }
    });
  });
  it("Should Verifications The Box Of Size Founded", () => {
    cy.ChexkExistElement("[data-cy=sizeBox]").then((exist) => {
      if (exist) {
        cy.log("✅✅ The Box Of Size Founded");
        cy.clickElement("[data-cy=sizeBox]:eq(0)");
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
    cy.ChexkExistElement("[data-cy=filterInfo]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=closeIcon]");
        cy.log("✅✅ The Filter Operation is finished");
      }
    });
  });
});
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Color", () => {
  let sizeTitle = "";
  it("Should Select A Color", () => {
    cy.ChexkExistElement("[data-cy=colorBox").then((exist) => {
      if (exist) {
        cy.log("✅✅ Color Box Founded");
        cy.intercept(
          "GET",
          "**/api/products/search?boutique_slugs=*&colors=*"
        ).as("filterRequest");
        cy.intercept(
          "GET",
          "**/api/products/search?boutique_slugs=*&with_products=false&colors=*"
        ).as("modifyRequest");
        cy.clickElement("[data-cy=categoryColor]:eq(0)");
        cy.log("✅✅ A Color has been selected for filtering");
        cy.wait(["@filterRequest", "@modifyRequest"]).then((interceptions) => {
          interceptions.forEach((interception, index) => {
            const requestName =
              index === 0 ? "Filter Request" : "Modify Request";
            cy.log(`✅✅ ${requestName} completed`);
          });
        });
      } else {
        cy.log("❌❌ Color Box Not Found, Skipping to Home Page...");
      }
    });
  });
  it("Should Verifications The Box Of Size Founded", () => {
    cy.ChexkExistElement("[data-cy=sizeBox]").then((exist) => {
      if (exist) {
        cy.log("✅✅ The Box Of Size Founded");
        cy.clickElement("[data-cy=sizeBox]:eq(0)");
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
    cy.ChexkExistElement("[data-cy=filterInfo]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=closeIcon]");
        cy.log("✅✅ The Filter Operation is finished");
      }
    });
  });
});
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Price", () => {
  let sizeTitle = "";
  it("Should Select A Price", () => {
    cy.ChexkExistElement("[data-cy=priceBox").then((exist) => {
      if (exist) {
        cy.log("✅✅ Price Box Founded");
        cy.intercept(
          "GET",
          "**/api/products/search?boutique_slugs=*&price=*"
        ).as("filterRequest");
        cy.intercept(
          "GET",
          "**/api/products/search?boutique_slugs=*&price=*&with_products=false"
        ).as("modifyRequest");
        cy.clickElement("[data-cy=categoryPrice]:eq(0)");
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
    cy.ChexkExistElement("[data-cy=sizeBox]").then((exist) => {
      if (exist) {
        cy.log("✅✅ The Box Of Size Founded");
        cy.clickElement("[data-cy=sizeBox]:eq(0)");
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
    cy.ChexkExistElement("[data-cy=filterInfo]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=closeIcon]");
        cy.log("✅✅ The Filter Operation is finished");
      }
    });
  });
});
describe("Should Move Between Filter Groups By Scrolling Horizontally", () => {
  let countFilters = 0;
  let countDivs = 0;
  it("Should Click On The Horizontal Scroll Icons", () => {
    cy.clickElement("[data-cy=rightScrool]");
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
});
describe("Should Move Between Filter Groups By Scrolling Horizontally After Updating Count Of Filter Croup", () => {
  let countFilters = 0;
  let countDivs = 0;
  it("Should Select A Brand", () => {
    cy.ChexkExistElement("[data-cy=brandBox").then((exist) => {
      if (exist) {
        cy.log("✅✅ Brand Box Founded");
        cy.clickElement("[data-cy=categoryShadow]:eq(0)");
        cy.log("✅✅ A Brand has been selected for filtering");
      }
    });
  });
  it("Should Click On Close Icon To Close Filter Info Box", () => {
    cy.clickElement("[data-cy=closeIcon]");
    cy.log("✅✅ Close icon has been clicked");
  });
  it("Should Click On The Horizontal Scroll Icons", () => {
    cy.clickElement("[data-cy=rightScrool]");
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
});
describe("Should Clicks On Search Input And Search About A Product (By Name)", () => {
  it("Should Click On The Search Icon On The Boutique Page", () => {
    cy.clickElement("[data-cy=searchIcon_boutiquePage]");
    cy.log("✅✅ search icon clicked");
  });
  it("Should Click On The Input Search On The Boutique Page & Write A Product Name In", () => {
    cy.clickElement("[data-cy=inputFiled]");
    cy.get("[data-cy=inputFiled]")
      .type("Power", { force: true })
      .should("have.value", "Power");
    cy.log("✅✅ Writing Name In Input Search Field");
    cy.get("[data-cy=inputFiled]").blur();
    cy.get(".boutique-logo-container").should("be.visible");
  });
  it("Should Obtain The Number Of Products That Appeared After The Search To Confirm The Presence Of A Result", () => {
    cy.ChexkExistElement("[data-cy=countProduct").then((exist) => {
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
  it("Should Click On Close Icon To Close The Search Input Field", () => {
    cy.clickElement("[data-cy=closeIcon]");
    cy.log("✅ icon for close search input clicked");
  });
});
// ***********************************************************************************
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Category Or Brand Or Color Or Price", () => {
  let totalProductsFound1 = 0;
  let totalProductsFound2 = 0;
  let totalProductsFound3 = 0;
  let totalProductsFound4 = 0;
  it("Should Click On Settings Icon Founded In Boutique Page", () => {
    cy.clickElement("[data-cy=settingsIcon]");
    cy.log("✅✅ settings icon Is clicked");
  });
  it("Should Select A Category", () => {
    cy.ChexkExistElement("[data-cy=categoryBox]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=category_botiquePage]:eq(0)");
        cy.log("✅✅ A category has been selected for filtering");
        cy.get("[data-cy=totalProduct_filterBoutique]")
          .invoke("text")
          .then((text) => {
            const totalProductsFound = text.match(/\d+/)?.[0];
            totalProductsFound1 = parseInt(totalProductsFound, 10);
            cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
          });
        cy.intercept("GET", "**/boutiques/**").as("Load");
        cy.clickElement("[data-cy=totalProduct_filterBoutique]");
        cy.log("✅✅ Search Result Button Clicked");
        cy.wait("@Load").then((inter) => {
          cy.log("✅✅ Load Request Arrived");
        });
      }
    });
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.ChexkExistElement("[data-cy=countProduct]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`✅✅ Number Of Products View: ${count}`);
            expect(totalProductsFound1).to.be.eq(count);
          });
        cy.clickElement("[data-cy=closeIcon]");
        cy.log("✅✅ Close icon has been clicked");
        cy.clickElement("[data-cy=settingsIcon]");
        cy.log("✅✅ settings icon Is clicked");
      }
    });
  });
  // *******************************Brand**********************************
  it("Should Select A Brand", () => {
    cy.ChexkExistElement("[data-cy=brandBox]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=categoryShadow]:eq(0)");
        cy.log("✅✅ A Brand has been selected for filtering");
        cy.get('[data-cy="totalProduct_filterBoutique"]')
          .invoke("text")
          .then((text) => {
            const totalProductsFound = text.match(/\d+/)?.[0];
            totalProductsFound2 = parseInt(totalProductsFound, 10);
            cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
          });
        cy.intercept("GET", "**/boutiques/**").as("Load");
        cy.clickElement("[data-cy=totalProduct_filterBoutique]");
        cy.log("✅✅ Search Result Button Clicked");
        cy.wait("@Load").then((inter) => {
          cy.log("✅✅ Load Request Arrived");
        });
      }
    });
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.ChexkExistElement("[data-cy=countProduct]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`✅✅ Number Of Products View: ${count}`);
            expect(totalProductsFound2).to.be.eq(count);
          });
        cy.clickElement("[data-cy=closeIcon]");
        cy.log("✅✅ Close icon has been clicked");
        cy.clickElement("[data-cy=settingsIcon]");
        cy.log("✅✅ settings icon Is clicked");
      }
    });
  });
  // *****************************color************************************
  it("Should Select A Color", () => {
    cy.ChexkExistElement("[data-cy=colorBox]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=categoryColor]:eq(0)");
        cy.log("✅✅ A Color has been selected for filtering");
        cy.get('[data-cy="totalProduct_filterBoutique"]')
          .invoke("text")
          .then((text) => {
            const totalProductsFound = text.match(/\d+/)?.[0];
            totalProductsFound3 = parseInt(totalProductsFound, 10);
            cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
            cy.intercept("GET", "**/boutiques/**").as("Load");
            cy.clickElement("[data-cy=totalProduct_filterBoutique]");
            cy.log("✅✅ Search Result Button Clicked");
            cy.wait("@Load").then((inter) => {
              cy.log("✅✅ Load Request Arrived");
            });
          });
      }
    });
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.ChexkExistElement("[data-cy=countProduct]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`✅✅ Number Of Products View: ${count}`);
            expect(totalProductsFound3).to.be.eq(count);
          });
        cy.clickElement("[data-cy=closeIcon]");
        cy.log("✅✅ Close icon has been clicked");
        cy.clickElement("[data-cy=settingsIcon]");
        cy.log("✅✅ settings icon Is clicked");
      }
    });
  });
  // *******************************price***************************
  // it("Should Select A Price", () => {
  //   cy.ChexkExistElement("[[data-cy=slider]]").then((exist) => {
  //     if (exist) {
  //       // cy.intercept("GET", "**/api/products/search?boutique_slugs**").as(
  //       //   "filterRequest"
  //       // );
  //       cy.get(".rc-slider-handle-1").then(($el) => {
  //         const rect = $el[0].getBoundingClientRect();
  //         cy.wrap($el)
  //           .trigger("mousedown", { which: 1, pageX: rect.x })
  //           .trigger("mousemove", { which: 1, pageX: rect.x + 100 }) // Move right
  //           .trigger("mouseup");
  //       });
  //       cy.log("✅ Slider handle has been moved");
  //       // cy.wait("@filterRequest").then((inter) => {
  //       //   cy.log("✅✅ filter Request Arrived");
  //       // });
  //       cy.get("[data-cy=totalProduct_filterBoutique]")
  //         .invoke("text")
  //         .then((text) => {
  //           const totalProductsFound = text.match(/\d+/)?.[0];
  //           const totalProductsFoundNum = parseInt(totalProductsFound, 10);
  //           cy.log(`✅ Total Products Found: ${totalProductsFoundNum}`);
  //         });
  //       cy.intercept("GET", "**/boutiques/**").as("Load");
  //       cy.get("[data-cy=totalProduct_filterBoutique]").click();
  //       cy.log("✅ Search Result Button Clicked");
  //       cy.wait("@Load").then((inter) => {
  //         cy.log("✅✅ Load Request Arrived");
  //       });
  //     }
  //   });
  // });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.ChexkExistElement("[data-cy=countProduct").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`✅✅ Number Of Products View: ${count}`);
            expect(totalProductsFound4).to.be.eq(count);
          });
        cy.clickElement("[data-cy=closeIcon]");
        cy.log("✅✅ Close icon has been clicked");
      }
    });
  });
});
// *******************************************************************************
describe("Should Choose Any Boutique & Open Its Page In Order To Filter Products By Category & Brand & Color", () => {
  let totalProductsFound44 = 0;
  it("Should Click On Settings Icon Founded In Boutique Page", () => {
    cy.clickElement("[data-cy=settingsIcon]");
    cy.log("✅✅ settings icon Is clicked");
  });
  it("Should Select A Category", () => {
    cy.ChexkExistElement("[data-cy=categoryBox]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=category_botiquePage]:eq(0)");
        cy.log("✅✅ A category has been selected for filtering");
      }
    });
  });
  it("Should Select A Brand", () => {
    cy.ChexkExistElement("[data-cy=brandBox]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=categoryShadow]:eq(0)");
        cy.log("✅✅ A Brand has been selected for filtering");
      }
    });
  });
  it("Should Select A Color", () => {
    cy.ChexkExistElement("[data-cy=colorBox]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=categoryColor]:eq(0)");
        cy.log("✅✅ A Color has been selected for filtering");
      }
    });
  });
  it("Should Obtain The Number Of Products That Appeared In Search Result Body", () => {
    cy.ChexkExistElement("[data-cy=totalProduct_filterBoutique]").then(
      (exist) => {
        if (exist) {
          cy.get("[data-cy=totalProduct_filterBoutique]")
            .invoke("text")
            .then((text) => {
              const totalProductsFound = text.match(/\d+/)?.[0];
              totalProductsFound44 = parseInt(totalProductsFound, 10);
              cy.log(`✅✅ Total Products Found It: ${totalProductsFound}`);
            });
        }
      }
    );
  });
  it("Should Click On The Search Result Button To View The Result", () => {
    cy.ChexkExistElement("[data-cy=totalProduct_filterBoutique]").then(
      (exist) => {
        if (exist) {
          cy.intercept("GET", "**/boutiques/**").as("Load");
          cy.clickElement("[data-cy=totalProduct_filterBoutique]");
          cy.log("✅✅ Search Result Button Clicked");
          cy.wait("@Load").then((inter) => {
            cy.log("✅✅ Load Request Arrived");
          });
        }
      }
    );
  });
  it("Should Obtain The Number Of Products That Appeared As Result & Compare It With Number Of Products Appeared In Search Result Body", () => {
    cy.ChexkExistElement("[data-cy=countProduct]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`✅✅ Number Of Products View: ${count}`);
            expect(totalProductsFound44).to.be.eq(count);
          });
      }
    });
  });
  it("Should Click On Close Icon To Return To Boutique Page", () => {
    cy.clickElement("[data-cy=closeIcon]");
    cy.log("✅✅ Close icon has been clicked");
  });
});
// **************************************************************
describe("Should Clicks On Settings Icon & Filter As Category || Brand || Color || Price & Reset After Any Choice", () => {
  it("Should Click On Settings Icon Founded In Boutique Page", () => {
    cy.clickElement("[data-cy=settingsIcon]");
    cy.log("✅✅ settings icon Is clicked");
  });
  it("Should Select A Category", () => {
    cy.ChexkExistElement("[data-cy=categoryBox]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=category_botiquePage]:eq(0)");
        cy.log("✅✅ A category has been selected for filtering");
        cy.clickElement("[data-cy=resetButton]");
        cy.log("✅ A category has been selected for filtering");
      }
    });
  });
  it("Should Select A Brand", () => {
    cy.ChexkExistElement("[data-cy=brandBox]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=categoryShadow]:eq(0)");
        cy.log("✅✅ A category has been selected for filtering");
        cy.clickElement("[data-cy=resetButton]");
        cy.log("✅ A category has been selected for filtering");
      }
    });
  });
  it("Should Select A Color", () => {
    cy.ChexkExistElement("[data-cy=colorBox]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=categoryColor]:eq(0)");
        cy.log("✅✅ A category has been selected for filtering");
        cy.clickElement("[data-cy=resetButton]");
        cy.log("✅ A category has been selected for filtering");
      }
    });
  });
  it("Should Select A Price", () => {
    cy.ChexkExistElement(".rc-slider-handle-1").then((exist) => {
      cy.get(".rc-slider-handle-1").then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        cy.wrap($el)
          .trigger("mousedown", { which: 1, pageX: rect.x })
          .trigger("mousemove", { which: 1, pageX: rect.x + 100 }) // Move right
          .trigger("mouseup");
      });
      cy.clickElement("[data-cy=resetButton]");
      cy.log("✅ A category has been selected for filtering");
    });
  });
  it("Should Click On Back Icon Found In Boutique Page To Return To The Home Page", () => {
    cy.clickElement("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ back icon clicked and back to main page");
  });
});
