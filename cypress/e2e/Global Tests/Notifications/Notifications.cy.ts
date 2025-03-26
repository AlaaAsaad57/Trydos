describe("Should Open The Website & Login", () => {
  before("Visit The Site", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Login Firstly", () => {
    cy.ChexkExistElement("[data-cy=NavUserName]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=NavUserName]")
          .invoke("text")
          .then((text) => {
            cy.log(`${text}`);
            if (text != "Abdo Hamdan") {
              cy.logout();
              cy.performLogin();
            } else {
              cy.log("✅✅ The user you want he is login");
            }
          });
      } else {
        cy.performLogin();
      }
    });
  });
});
describe("should enable notifications in product detail page", () => {
  let buttons: number = 0;
  it("should open a product detail page", () => {
    cy.ChooseBoutiqueAndVerifyComponentsAndBoxsInBoutiquePage();
  });
  it("should enable notifications for this product", () => {
    cy.clickElement("[data-cy=ThreePointsIcon]");
    cy.get("[data-cy=ExtendThreePointsSection]").should("be.visible");
    cy.get("[data-cy=ExtendThreePointsSection] div span")
      .contains("More Options")
      .should("be.visible");
    cy.get(".content-extended").should("be.visible");
    cy.get(".Notify-button-container").should("be.visible");
    cy.get(".notify-row svg").should("be.visible");
    cy.get(".notify-row span")
      .contains("Notify Me About The Product When")
      .should("be.visible");
    cy.get("#slider-options").should("be.visible");
    cy.get(".button-option")
      .its("length")
      .then((length) => {
        if (length) {
          buttons = length;
          expect(length).to.be.greaterThan(4);
        }
      });
    const buttonTexts = []; // Array to hold the texts
    cy.get(".button-option")
      .each(($el) => {
        cy.wrap($el)
          .invoke("text")
          .then((text) => {
            buttonTexts.push(text.trim()); // Add text to array and trim whitespace
          });
      })
      .then(() => {
        // Log the array of texts in the desired format
        const formattedTexts = `[${buttonTexts.join(", ")}]`; // Format the array as a string
        cy.log("Button texts: ", formattedTexts);
      });
  });
  it("should click on each button & wait for request to arrive", () => {
    for (let i = 0; i < buttons - 1; i++) {
      cy.get(".button-option svg").then((interception) => {
        if (interception) {
          cy.intercept(
            "POST",
            "/api/new_v1/firebase_device_tokens/unsubscribe_topic"
          ).as("unsubscribeTopic");
          cy.get(".button-option")
            .eq(i)
            .click({ scrollBehavior: false, force: true }); // Click on the button at index i
          cy.wait("@unsubscribeTopic").then((interception) => {
            expect(interception.response.statusCode).to.be.eq(200);
            cy.log(
              `Request for unsubscribe button ${i + 1} completed:`,
              interception
            );
          });
        }
      });
      cy.intercept(
        "POST",
        "/api/new_v1/firebase_device_tokens/subscribe_topic"
      ).as("subscribeTopic");
      cy.get(".button-option")
        .eq(i)
        .click({ scrollBehavior: false, force: true }); // Click on the button at index i
      cy.wait("@subscribeTopic").then((interception) => {
        expect(interception.response.statusCode).to.be.eq(200);
        cy.log(
          `Request for subscribe button ${i + 1} completed:`,
          interception
        );
      });
    }
  });
});
