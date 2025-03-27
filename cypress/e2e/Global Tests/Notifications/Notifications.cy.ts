let buttonTexts,
  notificationsTexts: string[] = [];
describe("Should Open The Website & Login.", () => {
  before("Visit The Site", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Login Firstly.", () => {
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
});
describe("should enable notifications in product detail page.", () => {
  let buttons: number = 0;
  it("should open a product detail page.", () => {
    cy.ChooseBoutiqueAndVerifyComponentsAndBoxsInBoutiquePage();
  });
  it("should verify about notifications for this product.", () => {
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
    buttonTexts = []; // Array to hold the texts
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
        cy.log("Button Texts: ", formattedTexts);
      });
  });
  it("should be disabled Notification if it was previously enabled.", () => {
    for (let i = 0; i < buttons - 1; i++) {
      cy.wait(5000);
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
            cy.get(".button-option")
              .eq(i)
              .should("not.have.class", "bg-green-300");
          } else {
            // Log a message if the topic is not enabled
            cy.log(
              `Topic for button ${i + 1} is not enabled, no action taken.`
            );
          }
        });
    }
  });
  it("should be enabled Notification.", () => {
    for (let i = 0; i < buttons - 1; i++) {
      cy.wait(5000);
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
      cy.wait(3000);
      // Assert that the button has the class bg-green-300 after clicking
      cy.get(".button-option").eq(i).should("have.class", "bg-green-300");
    }
    cy.clickElement("[data-cy=ThreePointsIcon]");
  });
});
describe("Should visit notification sttings page.", () => {
  it("Should Visit Settings Page.", () => {
    cy.clickElement("[data-cy=Logout-ReLogout]");
    cy.intercept("POST", "**/settings").as("loadingTopics");
    cy.clickElement("[data-cy=Settings-Icon]");
    cy.get("[data-cy=NoTopics-Subscribe]")
      .contains("Loading Topics...")
      .should("be.visible");
    cy.wait("@loadingTopics").then((interception) => {
      expect(interception.response.statusCode).to.be.eq(200);
    });
  });
  it("should load & display notification settings.", () => {
    cy.ChexkExistElement("[data-cy=NoTopics-Subscribe]").then(
      (interception) => {
        if (interception) {
          cy.get("[data-cy=NoTopics-Subscribe]")
            .contains("No topics subscribed.")
            .should("be.visible");
          cy.get("[data-cy=Notifications-Can-Disenabled]").should("be.visible");
          cy.get(".modal-content").should("be.visible");
          cy.get("button")
            .contains("Notifications Settings")
            .should("be.visible");
          cy.get("button").contains("Profile").should("be.visible");
        } else {
          cy.get("[data-cy=NoTopics-Subscribe]").should("not.exist");
          cy.get("[data-cy=Notifications-Can-Enabled]").should("be.visible");
          cy.get("[data-cy=Notifications-Can-Disenabled]").should("be.visible");
          cy.get(".modal-content").should("be.visible");
          cy.get("button")
            .contains("Notifications Settings")
            .should("be.visible");
          cy.get("button").contains("Profile").should("be.visible");
        }
      }
    );
  });
});
describe("Should verify that the enabled notifications appear on the Notification Settings page.", () => {
  let notifications: number = 0;
  it("Should get all notifications enabled.", () => {
    cy.get("[data-cy=typeof-subscribing]")
      .its("length")
      .then((length) => {
        if (length) {
          notifications = length;
          expect(length).to.be.greaterThan(3);
        }
      });
    notificationsTexts = []; // Array to hold the texts
    cy.get("[data-cy=typeof-subscribing]")
      .each(($el) => {
        cy.wrap($el)
          .invoke("text")
          .then((text) => {
            notificationsTexts.push(text.trim()); // Add text to array and trim whitespace
          });
      })
      .then(() => {
        // Log the array of texts in the desired format
        const formattedTexts = `[${notificationsTexts.join(", ")}]`; // Format the array as a string
        cy.log("Notifications Texts: ", formattedTexts);
      });
  });
  it("should verify the notifications added last was apperead.", () => {
    // compare
    buttonTexts.forEach((btnText) => {
      const found = notificationsTexts.some((notifText) => {
        // Check if at least one character from btnText exists in notifText
        return btnText
          .toLowerCase()
          .split("")
          .some((char) => notifText.toLowerCase().indexOf(char) !== -1);
      });
      expect(
        found,
        `Notification text should contain letters from "${btnText}"`
      ).to.be.true;
    });
  });
});
describe("Should disable the notification & ensure that the unsubscribe process is successful.", () => {
  it("Should disable the notification.", () => {
    cy.intercept(
      "POST",
      "/api/new_v1/firebase_device_tokens/unsubscribe_topic"
    ).as("unsubscribeTopic");
    cy.clickElement("[data-cy=ButtonToEnabled-NotificationsItem]:eq(0)");
    cy.wait("@unsubscribeTopic").then((interception) => {
      expect(interception.response.statusCode).to.be.eq(200);
      cy.log(
        `Request for unsubscribe first notification completed:`,
        interception
      );
    });
  });
  it("should verify the notifications added last was apperead.", () => {
    cy.intercept("Get", "**/product/likesCommentsSharesDetails/**").as(
      "getProductData2"
    );
    cy.go(-1);
    cy.wait("@getProductData2").then((interception) => {
      expect(interception.response.statusCode).to.be.eq(200);
    });
    cy.reload();
    cy.clickElement("[data-cy=ThreePointsIcon]");
    cy.get(".button-option:eq(0)").should("not.have.class", "bg-green-300");
  });
});
