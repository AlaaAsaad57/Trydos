describe("Should Open Two Window And Login From each Window", () => {
  before(() => {
    cy.Visit("/");
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
});
