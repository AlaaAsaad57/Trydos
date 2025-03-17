/// <reference types="cypress-file-upload" />

describe("Should Open Site And Login And Send Message", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/tr-en");
  });
  it("should Visit The Site And Login", () => {
    cy.wait(1000);
    cy.logout();
    cy.wait(1000);
    cy.intercept("POST", "**/api/v1/users/login").as("LoginChat");

    cy.performLogin();
    cy.get("@LoginChat", { timeout: 20000 });
  });
  it("should Open Chats", () => {
    cy.intercept("POST", "**/api/v2/channels/my_channels").as("GetChat");

    cy.wait("@GetChat", { timeout: 25000 });
    cy.get("[data-cy=Chat-Icon]").click({ scrollBehavior: false });
    cy.get(".app", { timeout: 10000 });
    cy.Exist(".chat-conversation-item").then((s) => {
      if (s) {
        cy.get(".chat-conversation-item")
          .eq(0)
          .click({ scrollBehavior: false });
      }
    });
    cy.wait(2000);
  });
  it("should send Text Message", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("SendApi");
    let a = parseInt((Math.random() * 1000).toString());
    cy.get(".input-chat").type(`Test${a}`);
    cy.get(".input-chat-container ~ svg", { timeout: 2000 }).click({
      scrollBehavior: false,
    });
    cy.wait("@SendApi").then((s) => {
      expect(s.response.statusCode === 200);
    });
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body.text-body .message-body-text-content"
    ).contains(`Test${a}`);
  });
  it("should reply to Text Message with text", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("SendApi");
    cy.get(".chat-message-container:nth-last-child(2) .message-hold")
      .last()
      .click({
        scrollBehavior: false,
      });
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .abs-menu .reply-but"
    )
      .last()
      .click({ scrollBehavior: false });
    let a = parseInt((Math.random() * 1000).toString());
    cy.get(".input-chat").type(`Reply Test${a}`);
    cy.get(".input-chat-container ~ svg", { timeout: 2000 }).click({
      scrollBehavior: false,
    });
    cy.wait("@SendApi").then((s) => {
      expect(s.response.statusCode === 200);
    });
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body.text-body .message-body-text-content"
    ).contains(`Reply Test${a}`);
  });

  // New test cases for image messages
});

describe("Should Send Image Message", () => {
  it("should send Image Message", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("SendApi");

    // Click the plus icon to open file upload

    // Upload image from public/images folder
    cy.get('input[type="file"]').selectFile("cypress/fixtures/images.jpeg", {
      force: true,
    });

    // Wait for the image to be uploaded and sent
    cy.wait("@SendApi").then((s) => {
      expect(s.response.statusCode === 200);
    });

    // Verify image message is displayed
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body"
    )
      .should("exist")
      .find("img")
      .should("be.visible");
  });

  it("should reply to Image Message with text", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("SendApi");

    // Click on the last image message to show reply options
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body"
    )
      .last()
      .click({ scrollBehavior: false });
    cy.Exist(".fixed-img-prev .svv").then((s) => {
      if (s) {
        cy.get(".fixed-img-prev .svv").last().click({ scrollBehavior: false });
      }
    });
    // Click reply button
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .abs-menu .reply-but"
    )
      .last()
      .click({ scrollBehavior: false });

    // Type and send reply text
    let a = parseInt((Math.random() * 1000).toString());
    cy.get(".input-chat").type(`Reply to image: ${a}`);
    cy.get(".input-chat-container ~ svg", { timeout: 2000 }).click({
      scrollBehavior: false,
    });

    // Verify reply was sent
    cy.wait("@SendApi").then((s) => {
      expect(s.response.statusCode === 200);
    });

    // Verify reply text is displayed
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body.text-body .message-body-text-content"
    ).contains(`Reply to image: ${a}`);
  });

  it("should reply to Image Message with another image", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("SendApi");

    // Click on the last image message to show reply options
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body"
    )
      .last()
      .click({ scrollBehavior: false });
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .abs-menu .reply-but"
    )
      .last()
      .click({ scrollBehavior: false });
    cy.Exist(".fixed-img-prev .svv").then((s) => {
      if (s) {
        cy.get(".fixed-img-prev .svv").last().click({ scrollBehavior: false });
      }
    });
    // Click reply button

    // Click plus icon to upload reply image

    // Upload reply image
    cy.get('input[type="file"]').selectFile("cypress/fixtures/images.jpeg", {
      force: true,
    });

    // Wait for the reply image to be sent
    cy.wait("@SendApi").then((s) => {
      expect(s.response.statusCode === 200);
    });

    // Verify reply image is displayed
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body"
    )
      .should("exist")
      .find("img")
      .should("be.visible");
  });
});
