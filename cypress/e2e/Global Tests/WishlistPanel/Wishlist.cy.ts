describe("should open trydos and open wishlist", () => {
  before("should open trydos", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Login Firstly", () => {
    cy.wait(3000);
    cy.ChexkExistElement("[data-cy=NavUserName]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=NavUserName]")
          .invoke("text")
          .then((text) => {
            // Remove all spaces from the extracted text
            const trimmedText = text.replace(/\s+/g, "");
            cy.log(`${trimmedText}`);

            // Compare the trimmed text with "Abdo Hamdan" without spaces
            if (trimmedText !== "AbdoHamdan") {
              cy.logout();
              cy.performLogin();
            } else {
              cy.log("✅✅ The user you want is logged in");
            }
          });
      } else {
        cy.performLogin();
      }
    });
  });
  it("should open wishlist", () => {
    cy.openWishlist();
  });
});
describe("should verify if content exists or not", () => {
  let colorLength: number = 0;
  it("should open wishlist", () => {
    cy.get("[data-cy=wishlist-item]")
      .its("length")
      .then((length) => {
        if (length) {
          // Add an assertion to verify the wishlist is opened
          expect(length).to.be.greaterThan(0);
          cy.get("[data-cy=wishList-card]").should("exist").and("be.visible");
          cy.get("[data-cy=wishList-header]").should("exist").and("be.visible");
          cy.get("[data-cy=wishList-left]").should("exist").and("be.visible");
          cy.get("[data-cy=wishList-svg]").should("exist").and("be.visible");
          cy.get("[data-cy=wishList-statement]")
            .should("exist")
            .and("be.visible")
            .contains("Wishlist");
          cy.get("[data-cy=close-button]").should("exist").and("be.visible");
          cy.get("[data-cy=close-icon]").should("exist").and("be.visible");
          cy.get("[data-cy=wishlist-body]").should("exist").and("be.visible");
          cy.get("[data-cy=wishlist-item]").should("exist").and("be.visible");
          cy.get("[data-cy=wishlist-container-img]")
            .should("exist")
            .and("be.visible");
          cy.get("[data-cy=wishlist-img]").should("exist").and("be.visible");
          cy.get("[data-cy=wishlist-body-item]")
            .should("exist")
            .and("be.visible");
          cy.get("[data-cy=wishlist-item-name]")
            .should("exist")
            .and("be.visible")
            .and("not.be.empty");
          cy.get("[data-cy=wishlist-item-description]")
            .should("exist")
            .and("be.visible")
            .and("not.be.empty");
          cy.get("[data-cy=wishlist-item-price]")
            .should("exist")
            .and("be.visible");
          cy.get("[data-cy=wishlist-item-old-price]")
            .should("exist")
            .and("be.visible");
          cy.get("[data-cy=wishlist-item-new-price]")
            .should("exist")
            .and("be.visible");
          cy.get("[data-cy=wishlist-item-footer]")
            .should("exist")
            .and("be.visible");
          cy.get("[data-cy=wishlist-item-circles]")
            .should("exist")
            .and("be.visible");
          cy.get("[data-cy=wishlist-item-color-circle]")
            .should("exist")
            .and("be.visible");
          cy.get("[data-cy=wishlist-item-circles]:eq(0)").then(($circle) => {
            // Find the color circles within the specific wishlist item circles
            cy.wrap($circle)
              .find("[data-cy=wishlist-item-color-circle]")
              .its("length")
              .then((length) => {
                if (length) {
                  expect(length).to.be.greaterThan(0);
                  colorLength = length;
                  cy.log(`✅✅ the count of colors is ${colorLength}`);
                } else {
                  cy.log("No color circles found");
                }
              });
          });
          cy.get("[data-cy=wishlist-item-sizes]")
            .should("exist")
            .and("be.visible");
          cy.get("[data-cy=wishlist-item-sizes]:eq(0)")
            .invoke("text") // Get the text content of the element
            .then((text) => {
              // Extract sizes from the text
              const sizesString = text.replace("Sizes: ", ""); // Remove "Sizes: " part
              const sizesArray = sizesString.split(", "); // Split by comma and space
              const sizeCount = sizesArray.length; // Count the sizes

              // Log the count or assert it
              cy.log(`✅✅ Total sizes: ${sizeCount}`); // Logs the total sizes
              expect(sizeCount).to.be.greaterThan(0); // Example assertion
              expect(sizeCount).to.be.eq(colorLength);
            });
          cy.clickElement("[data-cy=close-icon]");
          cy.clickElement("[data-cy=avatar-options]");
        } else {
          // Optionally handle the case where there are no items✅✅
          cy.log("❌❌ No items in the wishlist");
          cy.get("[data-cy=empty-container]").should("exist").and("be.visible");
          cy.get("[data-cy=empty-icon]").should("exist").and("be.visible");
          cy.get("[data-cy=empty-statement]")
            .should("exist")
            .and("be.visible")
            .contains("Your wishlist is empty");
        }
      });
  });
});
