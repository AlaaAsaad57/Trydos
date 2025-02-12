describe("Search and Filter in Boutique page", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    // cy.clearAllData();
    cy.Visit("/");
    cy.wait(5000);
  });
  it("The user clicks on any boutique and then filters by category", () => {
    cy.wait(10000);
    cy.Exist(".offer-widget:nth-child(6)").then((exist) => {
      if (exist) {
        cy.clickElementForce(".offer-widget:nth-child(6)");
        cy.log("✅ An Boutiue selected");
        console.log("✅ An Boutiue selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Boutiue Is oppened");
        console.log("✅ The Boutiue Is oppened");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=category_botiquePage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
        cy.log("✅ A category has been selected for filtering");
        console.log("✅ A category has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=allCategory]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=allCategory]");
        cy.log("✅ All Category has been apperead after selected");
        console.log("✅ All Category has been apperead after selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅ Close icon has been clicked");
        console.log("✅ Close icon has been clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Filtering is finisged");
        console.log("✅ The Filtering is finisged");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅ back icon clicked and back to main page");
        console.log("✅ back icon clicked and back to main page");
      }
    });
  });
  // ***********************************************************************************
  it("The user clicks on any boutique and then filters by brand", () => {
    cy.wait(10000);
    cy.Exist(".offer-widget:nth-child(6)").then((exist) => {
      if (exist) {
        cy.clickElementForce(".offer-widget:nth-child(6)");
        cy.log("✅ An Boutiue selected");
        console.log("✅ An Boutiue selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Boutiue Is oppened");
        console.log("✅ The Boutiue Is oppened");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=categoryShadow]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
        cy.log("✅ A category Shadow has been selected for filtering");
        console.log("✅ A category Shadow has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=allCategory]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=allCategory]");
        cy.log("✅ All Category has been apperead after selected");
        console.log("✅ All Category has been apperead after selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅ Close icon has been clicked");
        console.log("✅ Close icon has been clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Filtering is finished");
        console.log("✅ The Filtering is finished");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅ back icon clicked and back to main page");
        console.log("✅ back icon clicked and back to main page");
      }
    });
  });
  // ***********************************************************************************
  it("The user clicks on any boutique and then filters by color", () => {
    cy.wait(10000);
    cy.Exist(".offer-widget:nth-child(6)").then((exist) => {
      if (exist) {
        cy.clickElementForce(".offer-widget:nth-child(6)");
        cy.log("✅ An Boutiue selected");
        console.log("✅ An Boutiue selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Boutiue Is oppened");
        console.log("✅ The Boutiue Is oppened");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=categoryColor]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
        cy.log("✅ A category color has been selected for filtering");
        console.log("✅ A category color has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=allCategory]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=allCategory]");
        cy.log("✅ All Category has been apperead after selected");
        console.log("✅ All Category has been apperead after selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅ Close icon has been clicked");
        console.log("✅ Close icon has been clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Filtering is finished");
        console.log("✅ The Filtering is finished");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅ back icon clicked and back to main page");
        console.log("✅ back icon clicked and back to main page");
      }
    });
  });
  // ***********************************************************************************
  it("The user clicks on any boutique and then filters by price", () => {
    cy.wait(10000);
    cy.Exist(".offer-widget:nth-child(6)").then((exist) => {
      if (exist) {
        cy.clickElementForce(".offer-widget:nth-child(6)");
        cy.log("✅ An Boutiue selected");
        console.log("✅ An Boutiue selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Boutiue Is oppened");
        console.log("✅ The Boutiue Is oppened");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=categoryPrice]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryPrice]").eq(0).click({ force: true });
        cy.log("✅ A category price has been selected for filtering");
        console.log("✅ A category price has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=allCategory]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=allCategory]");
        cy.log("✅ All Category has been apperead after selected");
        console.log("✅ All Category has been apperead after selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅ Close icon has been clicked");
        console.log("✅ Close icon has been clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Filtering is finished");
        console.log("✅ The Filtering is finished");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅ back icon clicked and back to main page");
        console.log("✅ back icon clicked and back to main page");
      }
    });
  });
  // ***********************************************************************************
  it("The user clicks on filter button and scroll to left to selected type of filtering", () => {
    cy.wait(10000);
    cy.Exist(".offer-widget:nth-child(6)").then((exist) => {
      if (exist) {
        cy.clickElementForce(".offer-widget:nth-child(6)");
        cy.log("✅ An Boutique selected");
        console.log("✅ An Boutique selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Boutique Is opened");
        console.log("✅ The Boutique Is opened");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=rightScrool]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=rightScrool]");
        cy.log("✅ Right scroll is clicked");
        console.log("✅ Right scroll is clicked");
      }
    });
    cy.wait(10000);
    let countFilters = 0;
    let countDivs = 0;
    cy.Exist("[data-cy=countFilters]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countFilters]")
          .its("length")
          .then((count) => {
            countFilters = count;
            cy.log(`Number Of count filters: ${countFilters}`);
            console.log("Total count filters:", countFilters);
          });
      }
    });
    cy.Exist("[data-cy=countFilters]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countFilters]")
          .its("length")
          .then((count) => {
            countFilters = count;
            cy.log(`Number Of count filters: ${countFilters}`);
            console.log("Total count filters:", countFilters);
          });
      }
    });
    cy.Exist(".boutique-category-filter").then((exist) => {
      if (exist) {
        cy.get(".boutique-category-filter")
          .should("exist") // Ensures at least one element exists
          .its("length")
          .then((count) => {
            countDivs = count;
            cy.log(`Number of divs found: ${countDivs}`);
            console.log("Number of divs found:", countDivs);
            cy.then(() => {
              if (countFilters === countDivs) {
                cy.log("✅ The number of filters matches the number of divs.");
                console.log(
                  "✅ The number of filters matches the number of divs."
                );
              } else {
                cy.log("❌ Mismatch: Filters and divs count are different.");
                console.log(
                  "❌ Mismatch: Filters and divs count are different."
                );
              }
            });
          });
      }
    });
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅ Back icon clicked and returned to main page");
        console.log("✅ Back icon clicked and returned to main page");
      }
    });
  });
  // ***********************************************************************************
  it("The user clicks on search input and search about an product (by name)", () => {
    cy.wait(10000);
    cy.Exist(".offer-widget:nth-child(6)").then((exist) => {
      if (exist) {
        cy.clickElementForce(".offer-widget:nth-child(6)");
        cy.log("✅ An Boutique selected");
        console.log("✅ An Boutique selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Boutique Is opened");
        console.log("✅ The Boutique Is opened");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=searchIcon_boutiquePage]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=searchIcon_boutiquePage]");
        cy.log("✅ search icon clicked");
        console.log("✅ search icon clicked");
        cy.wait(5000);
      }
    });
    cy.Exist("[data-cy=inputFiled]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=inputFiled]")
          .type("Power", { force: true })
          .should("have.value", "Power"); // Ensure text was typed
        cy.wait(5000);
      }
    });
    cy.Exist("[data-cy=countProduct]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=countProduct]")
          .its("length")
          .then((count) => {
            cy.log(`Number Of Products View: ${count}`);
            console.log("Total Products View:", count);
            if (count > 0) {
              console.log("There are an result");
              cy.log("✅✅ There are an result");
            } else {
              console.log("no result found");
              cy.log("❌❌ no result found");
            }
          });
        cy.wait(10000);
      }
    });
    cy.log("✅ Typed in search input");
    console.log("✅ Typed in search input");
    cy.Exist("[data-cy=inputFiled]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=inputFiled]").clear();
        cy.log("✅ Cleared the search input");
        console.log("✅ Cleared the search input");
      }
    });
    cy.wait(15000);
    cy.Exist("[data-cy=inputFiled]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=inputFiled]").type(" ", {
          force: true,
        });
        cy.log("✅ Typed in search input");
        console.log("✅ Typed in search input");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeSearchInput]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=closeSearchInput]");
        cy.log("✅ icon for close search input clicked");
        console.log("✅ icon for close search input clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅ Back icon clicked and returned to main page");
        console.log("✅ Back icon clicked and returned to main page");
      }
    });
  });
  // ***********************************************************************************
  it("The user clicks on settings icon and filter as category or brand or color or price", () => {
    cy.wait(10000);
    cy.Exist(".offer-widget:nth-child(6)").then((exist) => {
      if (exist) {
        cy.clickElementForce(".offer-widget:nth-child(6)");
        cy.log("✅ An Boutique selected");
        console.log("✅ An Boutique selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Boutique Is opened");
        console.log("✅ The Boutique Is opened");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=settingsIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=settingsIcon]");
        cy.log("✅ settings icon Is clicked");
        console.log("✅ settings icon Is clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=category_botiquePage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
        // cy.clickElementForce("[data-cy=category_botiquePage]");
        cy.log("✅ A category has been selected for filtering");
        console.log("✅ A category has been selected for filtering");
      }
    });
    cy.wait(10000);
    let totalProductsFound1 = 0;
    cy.Exist("[data-cy=totalProduct_filterBoutique]").then((exist) => {
      if (exist) {
        cy.get('[data-cy="totalProduct_filterBoutique"]')
          .invoke("text")
          .then((text) => {
            const totalProductsFound = text.match(/\d+/)?.[0];
            totalProductsFound1 = parseInt(totalProductsFound, 10);
            cy.log(`Total Products Found It: ${totalProductsFound}`);
            console.log("Total Products Found It:", totalProductsFound);
            cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
          });
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=countProduct]").then((exist) => {
      if (exist) {
        cy.get('[data-cy="countProduct"]')
          .its("length")
          .then((count) => {
            cy.log(`Number Of Products View: ${count}`);
            console.log("Total Products View:", count);
            if (totalProductsFound1 == count) {
              console.log("Total Products Found And Viewed Matched");
              cy.log("✅✅ Total Products Found And Viewed Matched");
            } else {
              console.log("Total Products Found And Viewed Not Matched");
              cy.log("❌❌ Total Products Found And Viewed Not Matched");
            }
          });
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅ Close icon has been clicked");
        console.log("✅ Close icon has been clicked");
      }
    });
    cy.wait(10000);
    // *******************************brand***************************
    cy.Exist("[data-cy=settingsIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=settingsIcon]");
        cy.log("✅ settings icon Is clicked");
        console.log("✅ settings icon Is clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=categoryShadow]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
        cy.log("✅ A category shadow has been selected for filtering");
        console.log("✅ A category shadow has been selected for filtering");
      }
    });
    cy.wait(10000);
    let totalProductsFound2 = 0;
    cy.Exist("[data-cy=totalProduct_filterBoutique]").then((exist) => {
      if (exist) {
        cy.get('[data-cy="totalProduct_filterBoutique"]')
          .invoke("text")
          .then((text) => {
            const totalProductsFound = text.match(/\d+/)?.[0];
            totalProductsFound2 = parseInt(totalProductsFound, 10);
            cy.log(`Total Products Found It: ${totalProductsFound}`);
            console.log("Total Products Found It:", totalProductsFound);
            cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
          });
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=countProduct]").then((exist) => {
      if (exist) {
        cy.get('[data-cy="countProduct"]')
          .its("length")
          .then((count) => {
            cy.log(`Number Of Products View: ${count}`);
            console.log("Total Products View:", count);
            if (totalProductsFound2 == count) {
              console.log("Total Products Found And Viewed Matched");
              cy.log("✅✅ Total Products Found And Viewed Matched");
            } else {
              console.log("Total Products Found And Viewed Not Matched");
              cy.log("❌❌ Total Products Found And Viewed Not Matched");
            }
          });
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅ Close icon has been clicked");
        console.log("✅ Close icon has been clicked");
      }
    });
    cy.wait(10000);
    // *******************************color***************************
    cy.Exist("[data-cy=settingsIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=settingsIcon]");
        cy.log("✅ settings icon Is clicked");
        console.log("✅ settings icon Is clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=categoryColor]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
        cy.log("✅ A category color has been selected for filtering");
        console.log("✅ A category color has been selected for filtering");
      }
    });
    cy.wait(10000);
    let totalProductsFound3 = 0;
    cy.Exist("[data-cy=totalProduct_filterBoutique]").then((exist) => {
      if (exist) {
        cy.get('[data-cy="totalProduct_filterBoutique"]')
          .invoke("text")
          .then((text) => {
            const totalProductsFound = text.match(/\d+/)?.[0];
            totalProductsFound3 = parseInt(totalProductsFound, 10);
            cy.log(`Total Products Found It: ${totalProductsFound}`);
            console.log("Total Products Found It:", totalProductsFound);
            cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
          });
      } else {
        cy.log("Total Products not Found");
        console.log("Total Products not Found");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=countProduct]").then((exist) => {
      if (exist) {
        cy.get('[data-cy="countProduct"]')
          .its("length")
          .then((count) => {
            cy.log(`Number Of Products View: ${count}`);
            console.log("Total Products View:", count);
            if (totalProductsFound3 == count) {
              console.log("Total Products Found And Viewed Matched");
              cy.log("✅✅ Total Products Found And Viewed Matched");
            } else {
              console.log("Total Products Found And Viewed Not Matched");
              cy.log("❌❌ Total Products Found And Viewed Not Matched");
            }
          });
      } else {
        cy.log("Products not Found for this filter");
        console.log("Products not Found for this filter");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅ Close icon has been clicked");
        console.log("✅ Close icon has been clicked");
      }
    });
    cy.wait(10000);
    // *******************************price***************************
    cy.Exist("[data-cy=settingsIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=settingsIcon]");
        cy.log("✅ settings icon Is clicked");
        console.log("✅ settings icon Is clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=slider]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=slider]").eq(0).click({ force: true });
        cy.log("✅ slider has been selected for filtering");
        console.log("✅ slider has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist(".rc-slider-handle-1").then((exist) => {
      if (exist) {
        cy.get(".rc-slider-handle-1").then(($el) => {
          const rect = $el[0].getBoundingClientRect();
          cy.wrap($el)
            .trigger("mousedown", { which: 1, pageX: rect.x })
            .trigger("mousemove", { which: 1, pageX: rect.x + 100 }) // Move right
            .trigger("mouseup");
        });
      }
    });
    cy.wait(10000);
    let totalProductsFound4 = 0;
    cy.Exist("[data-cy=totalProduct_filterBoutique]").then((exist) => {
      if (exist) {
        cy.get('[data-cy="totalProduct_filterBoutique"]')
          .invoke("text")
          .then((text) => {
            const totalProductsFound = text.match(/\d+/)?.[0];
            totalProductsFound4 = parseInt(totalProductsFound, 10);
            cy.log(`Total Products Found It: ${totalProductsFound}`);
            console.log("Total Products Found It:", totalProductsFound);
            cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
          });
      } else {
        cy.log("Total Products not Found");
        console.log("Total Products not Found");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=countProduct]").then((exist) => {
      if (exist) {
        cy.get('[data-cy="countProduct"]')
          .its("length")
          .then((count) => {
            cy.log(`Number Of Products View: ${count}`);
            console.log("Total Products View:", count);
            if (totalProductsFound4 == count) {
              console.log("Total Products Found And Viewed Matched");
              cy.log("✅✅ Total Products Found And Viewed Matched");
            } else {
              console.log("Total Products Found And Viewed Not Matched");
              cy.log("�� Total Products Found And Viewed Not Matched");
            }
          });
      } else {
        cy.log("Products not Found for this filter");
        console.log("Products not Found for this filter");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅ Close icon has been clicked");
        console.log("✅ Close icon has been clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅ Back icon clicked and returned to main page");
        console.log("✅ Back icon clicked and returned to main page");
      }
    });
    cy.wait(10000);
  });
  it("The user clicks on settings icon and filter as category and brand and color", () => {
    cy.wait(10000);
    cy.Exist(".offer-widget:nth-child(6)").then((exist) => {
      if (exist) {
        cy.clickElementForce(".offer-widget:nth-child(6)");
        cy.log("✅ An Boutique selected");
        console.log("✅ An Boutique selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Boutique Is opened");
        console.log("✅ The Boutique Is opened");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=settingsIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=settingsIcon]");
        cy.log("✅ settings icon Is clicked");
        console.log("✅ settings icon Is clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=category_botiquePage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
        cy.log("✅ A category has been selected for filtering");
        console.log("✅ A category has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=categoryShadow]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
        cy.log("✅ A category shadow has been selected for filtering");
        console.log("✅ A category shadow has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=categoryColor]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
        cy.log("✅ A category color has been selected for filtering");
        console.log("✅ A category color has been selected for filtering");
      }
    });
    cy.wait(10000);
    let totalProductsFound3 = 0;
    cy.Exist("[data-cy=totalProduct_filterBoutique]").then((exist) => {
      if (exist) {
        cy.get('[data-cy="totalProduct_filterBoutique"]')
          .invoke("text")
          .then((text) => {
            const totalProductsFound = text.match(/\d+/)?.[0];
            totalProductsFound3 = parseInt(totalProductsFound, 10);
            cy.log(`Total Products Found It: ${totalProductsFound}`);
            console.log("Total Products Found It:", totalProductsFound);
            cy.clickElementForce("[data-cy=totalProduct_filterBoutique]");
          });
      } else {
        cy.log("Total Products not Found");
        console.log("Total Products not Found");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=countProduct]").then((exist) => {
      if (exist) {
        cy.get('[data-cy="countProduct"]')
          .its("length")
          .then((count) => {
            cy.log(`Number Of Products View: ${count}`);
            console.log("Total Products View:", count);
            if (totalProductsFound3 == count) {
              console.log("Total Products Found And Viewed Matched");
              cy.log("✅✅ Total Products Found And Viewed Matched");
            } else {
              console.log("Total Products Found And Viewed Not Matched");
              cy.log("❌❌ Total Products Found And Viewed Not Matched");
            }
          });
      } else {
        cy.log("Products not Found for this filter");
        console.log("Products not Found for this filter");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=closeIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=closeIcon]");
        cy.log("✅ Close icon has been clicked");
        console.log("✅ Close icon has been clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅ Back icon clicked and returned to main page");
        console.log("✅ Back icon clicked and returned to main page");
      }
    });
    cy.wait(10000);
  });
  it("The user clicks on settings icon and filter as category or brand or color or price and reset after any choice", () => {
    cy.wait(10000);
    cy.Exist(".offer-widget:nth-child(6)").then((exist) => {
      if (exist) {
        cy.clickElementForce(".offer-widget:nth-child(6)");
        cy.log("✅ An Boutique selected");
        console.log("✅ An Boutique selected");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=boutiqueOpen]").then((exist) => {
      if (exist) {
        cy.log("✅ The Boutique Is opened");
        console.log("✅ The Boutique Is opened");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=settingsIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=settingsIcon]");
        cy.log("✅ settings icon Is clicked");
        console.log("✅ settings icon Is clicked");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=category_botiquePage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=category_botiquePage]").eq(0).click({ force: true });
        // cy.clickElementForce("[data-cy=category_botiquePage]");
        cy.log("✅ A category has been selected for filtering");
        console.log("✅ A category has been selected for filtering");
      }
    });
    cy.wait(10000);
    // resetbutton/
    cy.Exist("[data-cy=resetButton]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=resetButton]").click({ force: true });
        // cy.clickElementForce("[data-cy=category_botiquePage]");
        cy.log("✅ A category has been selected for filtering");
        console.log("✅ A category has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=categoryShadow]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryShadow]").eq(0).click({ force: true });
        cy.log("✅ A category shadow has been selected for filtering");
        console.log("✅ A category shadow has been selected for filtering");
      }
    });
    cy.wait(10000);
    // resetbutton
    cy.Exist("[data-cy=resetButton]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=resetButton]").click({ force: true });
        // cy.clickElementForce("[data-cy=category_botiquePage]");
        cy.log("✅ A category has been selected for filtering");
        console.log("✅ A category has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=categoryColor]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=categoryColor]").eq(0).click({ force: true });
        cy.log("✅ A category color has been selected for filtering");
        console.log("✅ A category color has been selected for filtering");
      }
    });
    cy.wait(10000);
    // resetbytton
    cy.Exist("[data-cy=resetButton]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=resetButton]").click({ force: true });
        // cy.clickElementForce("[data-cy=category_botiquePage]");
        cy.log("✅ A category has been selected for filtering");
        console.log("✅ A category has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=slider]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=slider]").eq(0).click({ force: true });
        cy.log("✅ slider has been selected for filtering");
        console.log("✅ slider has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist(".rc-slider-handle-1").then((exist) => {
      if (exist) {
        cy.get(".rc-slider-handle-1").then(($el) => {
          const rect = $el[0].getBoundingClientRect();
          cy.wrap($el)
            .trigger("mousedown", { which: 1, pageX: rect.x })
            .trigger("mousemove", { which: 1, pageX: rect.x + 100 }) // Move right
            .trigger("mouseup");
        });
      }
    });
    cy.wait(10000);
    // resetbutton
    cy.Exist("[data-cy=resetButton]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=resetButton]").click({ force: true });
        // cy.clickElementForce("[data-cy=category_botiquePage]");
        cy.log("✅ A category has been selected for filtering");
        console.log("✅ A category has been selected for filtering");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
        cy.log("✅ Back icon clicked and returned to main page");
        console.log("✅ Back icon clicked and returned to main page");
      }
    });
    cy.wait(10000);
  });
});
