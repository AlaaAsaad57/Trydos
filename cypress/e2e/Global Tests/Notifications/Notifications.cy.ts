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
  it("should verify about notifications for this product", () => {
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
  it("should enable notifications for this product", () => {
    cy.wait(5000);
    for (let i = 0; i < buttons - 1; i++) {
      cy.get(".button-option")
        .eq(i)
        .then(($button) => {
          // Check if the button has the 'bg-green-300' class indicating the topic is enabled
          if ($button.hasClass("bg-green-300")) {
            cy.intercept(
              "POST",
              "/api/new_v1/firebase_device_tokens/unsubscribe_topic"
            ).as("unsubscribeTopic");
            // Click on the button and wait for the request
            cy.get(".button-option")
              .eq(i)
              .click({ scrollBehavior: false, force: true });
            cy.wait("@unsubscribeTopic").then((interception) => {
              expect(interception.response.statusCode).to.be.eq(200);
              cy.log(
                `Request for unsubscribe button ${i + 1} completed:`,
                interception
              );
            });
          } else {
            // Log a message if the topic is not enabled
            cy.log(
              `Topic for button ${i + 1} is not enabled, no action taken.`
            );
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
describe("Should visit notification sttings page", () => {
  it("Should Visit Settings Page", () => {
    cy.clickElement("[data-cy=Logout-ReLogout]");
    cy.clickElement("[data-cy=Settings-Icon]");
  });
});

//   it("should load and display notification settings", () => {
//     cy.get(".modal-content").should("be.visible");
//     cy.get("button").contains("Notifications Settings").should("be.visible");
//     cy.get("button").contains("Notification Test").should("be.visible");
//   });
//   it("should display subscribed topics", () => {
//     cy.get(".notifications-tab").scrollIntoView();
//     cy.get(".notifications-tab").within(() => {
//       cy.get("span")
//         .contains("Enabled Notifications Topic:")
//         .should("be.visible");
//       cy.get("ul").children().should("have.length.greaterThan", 0); // Ensure there are topics listed
//     });
//   });
//   it("should display unsubscribed topics and allow resubscribing", () => {
//     cy.get(".notifications-tab").scrollIntoView();
//     cy.get("p").contains("Disabled Notifications Topic:").should("be.visible");
//     cy.get("ul")
//       .children()
//       .first()
//       .within(() => {
//         cy.get("button:eq(0)")
//           .contains("Subscribe")
//           .click({ scrollBehavior: false, force: true });
//       });
//     cy.get(".notifications-tab").should("not.contain", "No topics subscribed.");
//   });
// it("should handle unsubscribe functionality", () => {
//   cy.get(".notifications-tab").scrollIntoView();
//   cy.get("ul")
//     .children()
//     .first()
//     .within(() => {
//       cy.get("button").contains("Unsubscribe").clickElement();
//     });
//   cy.get(".notifications-tab").should("contain", "No topics subscribed."); // Check if it updates correctly
// });

// it("should toggle email notifications", () => {
//   cy.get(".preferences-tab").scrollIntoView();
//   cy.get("span").contains("Enable Email Notifications").click();
//   cy.get('input[type="checkbox"]').should("be.checked"); // Check if it's checked
//   cy.get("span").contains("Enable Email Notifications").click();
//   cy.get('input[type="checkbox"]').should("not.be.checked"); // Check if it's unchecked
// });
// it("should change notification frequency", () => {
//   cy.get(".preferences-tab").scrollIntoView();
//   cy.get("select").select("weekly"); // Change to weekly
//   cy.get("select").should("have.value", "weekly"); // Verify the change
// });
// it("should close modal on outside click", () => {
//   cy.get(".modal-overlay").click(); // Click outside the modal
//   cy.get(".modal-content").should("not.exist"); // Ensure modal is closed
// });
// it("should handle loading states", () => {
//   cy.get(".modal-content").should("have.class", "opacity-30 cursor-wait"); // Check loading state
// });
// afterEach(() => {
//   cy.get(".modal-content")
//     .should("be.visible")
//     .then(() => {
//       cy.get(".modal-overlay").click();
//     });
// });
// });
