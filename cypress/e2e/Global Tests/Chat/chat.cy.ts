/// <reference types="cypress-file-upload" />

// ******************************* Chat Login & Initial Setup *********************************************************
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
});

// ******************************* Text Message Tests *********************************************************
describe("Should Send And Reply To Text Messages", () => {
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
});

// ******************************* Image Message Tests *********************************************************
describe("Should Send And Reply To Image Messages", () => {
  it("should send Image Message", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("SendApi");
    cy.get('input[type="file"]').selectFile("cypress/fixtures/images.jpeg", {
      force: true,
    });
    cy.wait("@SendApi").then((s) => {
      expect(s.response.statusCode === 200);
    });
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body"
    )
      .should("exist")
      .find("img")
      .should("be.visible");
  });

  it("should reply to Image Message with text", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("SendApi");
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
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .abs-menu .reply-but"
    )
      .last()
      .click({ scrollBehavior: false });
    let a = parseInt((Math.random() * 1000).toString());
    cy.get(".input-chat").type(`Reply to image: ${a}`);
    cy.get(".input-chat-container ~ svg", { timeout: 2000 }).click({
      scrollBehavior: false,
    });
    cy.wait("@SendApi").then((s) => {
      expect(s.response.statusCode === 200);
    });
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body.text-body .message-body-text-content"
    ).contains(`Reply to image: ${a}`);
  });

  it("should reply to Image Message with another image", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("SendApi");
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
    cy.get('input[type="file"]').selectFile("cypress/fixtures/images.jpeg", {
      force: true,
    });
    cy.wait("@SendApi").then((s) => {
      expect(s.response.statusCode === 200);
    });
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body"
    )
      .should("exist")
      .find("img")
      .should("be.visible");
  });
});

// ******************************* File Message Tests *********************************************************
describe("Should Send And Reply To File Messages", () => {
  it("should send File Message", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("SendApi");
    cy.get('input[type="file"]').selectFile("cypress/fixtures/test.txt", {
      force: true,
    });
    cy.wait("@SendApi").then((s) => {
      expect(s.response.statusCode === 200);
    });
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body"
    )
      .should("exist")
      .find("[data-cy='FILE-PNG']")
      .should("be.visible");
  });

  it("should reply to File Message with text", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("SendApi");
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
    let a = parseInt((Math.random() * 1000).toString());
    cy.get(".input-chat").type(`Reply to File: ${a}`);
    cy.get(".input-chat-container ~ svg", { timeout: 2000 }).click({
      scrollBehavior: false,
    });
    cy.wait("@SendApi").then((s) => {
      expect(s.response.statusCode === 200);
    });
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body.text-body .message-body-text-content"
    ).contains(`Reply to File: ${a}`);
  });

  it("should reply to Message with File", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("SendApi");
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
    cy.get('input[type="file"]').selectFile("cypress/fixtures/test.txt", {
      force: true,
    });
    cy.wait("@SendApi").then((s) => {
      expect(s.response.statusCode === 200);
    });
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body"
    )
      .should("exist")
      .find("[data-cy='FILE-PNG']")
      .should("be.visible");
  });
});

// ******************************* Message Management Tests *********************************************************
describe("Should Delete Message", () => {
  it("should click on Message To Show Options", () => {
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body"
    )
      .last()
      .click({ scrollBehavior: false });
  });

  it("should click on Delete Option", () => {
    cy.intercept("POST", "**/api/v1/messages/destroy").as("DeleteMessage");
    cy.get(
      '.chat-message-container:nth-last-child(2) .message-hold .abs-menu [data-cy="DELETE-OPTION"]'
    )
      .last()
      .click({ scrollBehavior: false });
    cy.wait(1000);
    cy.get(
      '.chat-message-container:nth-last-child(2) .message-hold .abs-menu [data-cy="DELETE-OPTION"]'
    )
      .last()
      .click({ scrollBehavior: false });
    cy.wait("@DeleteMessage").then((s) => {
      expect(s.response.statusCode).to.eq(200);
    });
  });
});
// ******************************* Message Forwarding Tests *********************************************************

describe("Should Forward Message To Another Chat", () => {
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
  it("should click on message to show options", () => {
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body"
    )
      .last()
      .click({ scrollBehavior: false });
  });

  it("should click on forward option", () => {
    cy.get(
      '.chat-message-container:nth-last-child(2) .message-hold .abs-menu [data-cy="FORWARD-OPTION"]'
    )
      .last()
      .click({ scrollBehavior: false });
  });

  it("should search for target chat", () => {
    cy.get('[data-cy="SearchInputChat"]').type("Magd");
  });

  it("should select target chat", () => {
    cy.intercept("POST", "**/api/v1/messages/send").as("ForwardMessage");
    cy.get('[data-cy="ContactItem"]').first().click({ scrollBehavior: false });
    cy.wait("@ForwardMessage").then((s) => {
      expect(s.response.statusCode).to.eq(200);
    });
  });
  it("should verify forwarded message appears in target chat", () => {
    cy.get(
      ".chat-message-container:nth-last-child(2) .message-hold .message-body"
    )
      .should("exist")
      .find(".forwarded-message-icon")
      .should("be.visible");
  });
});
describe("should delete chat", () => {
  it("should delete chat", () => {
    cy.get(".chat-screen-top svg").first().click({ scrollBehavior: false });
    cy.wait(3000);
    cy.get(".chat-conversation-item")
      .first()
      // @ts-ignore
      .realSwipe("toLeft", { length: 100 });
    cy.intercept("POST", "**/api/v1/channels/destroy").as("DeleteChat");
    cy.get(".chat-4").first().click({ scrollBehavior: false });
    cy.wait("@DeleteChat").then((s) => {
      expect(s.response.statusCode).to.eq(200);
    });
  });
});
// ******************************* Chat Management Tests *********************************************************
describe("Should Manage Chat Conversations", () => {
  it("should init new chat conversation", () => {
    cy.get('[data-cy="ContactsIcon"]').click({ scrollBehavior: false });
    cy.get('[data-cy="SearchInputChat"]').type("Magd");
    cy.get('[data-cy="ContactItem"]').first().click({ scrollBehavior: false });
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

  it("should delete chat", () => {
    cy.get(".chat-screen-top svg").first().click({ scrollBehavior: false });
    cy.get(".chat-conversation-item")
      .first()
      // @ts-ignore
      .realSwipe("toLeft", { length: 100 });
    cy.intercept("POST", "**/api/v1/channels/destroy").as("DeleteChat");
    cy.get(".chat-4").first().click({ scrollBehavior: false });
    cy.wait("@DeleteChat").then((s) => {
      expect(s.response.statusCode).to.eq(200);
    });
  });
});
describe("Pin and UnPin Chat", () => {
  it("should pin chat", () => {
    cy.intercept("POST", "**api/v1/channel_members/update").as("PinChat");
    cy.get(".chat-conversation-item")
      .last()
      // @ts-ignore
      .realSwipe("toRight", { length: 100 });
    cy.get(".chat-2").click({ scrollBehavior: false });
    cy.wait("@PinChat").then((s) => {
      expect(s.response.statusCode).to.eq(200);
    });
  });
  it("should unpin chat", () => {
    cy.intercept("POST", "**api/v1/channel_members/update").as("UnPinChat");
    cy.get(".chat-conversation-item")
      .first()
      // @ts-ignore
      .realSwipe("toRight", { length: 100 });
    cy.get(".chat-2").click({ scrollBehavior: false });
    cy.wait("@UnPinChat").then((s) => {
      expect(s.response.statusCode).to.eq(200);
    });
  });
});
