describe("10-1 should visit product page", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.wait(3000);
    cy.logout();
    cy.viewport(783, 824);
  });
  it("should Login If User Is Not Verified", () => {
    cy.performLogin();
  });
  it("should visit product page", () => {
    cy.get('[data-cy="boutique_link"]')
      .first()
      .click({ force: true, scrollBehavior: false });
  });
  it("should ensure that required requests are success", () => {
    cy.get('[data-cy="product_link"]')
      .first()
      .click({ force: true, scrollBehavior: false });
    cy.intercept("POST", "**/api/products/view").as("ViewsReq");
    cy.intercept("GET", "**/api/v1/web/product/likesDetails/**").as(
      "SocialDataReq"
    );
    cy.wait(["@ViewsReq", "@SocialDataReq"]).then((interceptions) => {
      expect(interceptions[0].response.statusCode).to.equal(200);
      expect(interceptions[1].response.statusCode).to.equal(200);
    });
  });
});
describe("10-2 should test product Actions", () => {
  it("should like and dislike product", () => {
    cy.intercept("POST", "**/product_likes/store").as("LikeProductReq");
    cy.get('[data-cy="LoveSymbol"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@LikeProductReq").then((interceptions) => {
      expect(interceptions.response.statusCode).to.equal(200);
    });
    cy.intercept("POST", "**/product_likes/delete").as("DislikeProductReq");
    cy.get('[data-cy="LoveSymbol"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@DislikeProductReq").then((interceptions) => {
      expect(interceptions.response.statusCode).to.equal(200);
    });
  });
  it("should share product", () => {
    cy.intercept("POST", "**api/v2/elastic/share_product_on_apps").as(
      "ShareProductReq"
    );
    cy.get('[data-cy="ShareIcon"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.get('[data-cy="Facebook"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@ShareProductReq").then((interceptions) => {
      expect(interceptions.response.statusCode).to.equal(200);
    });
  });
  it("should click on copy link button", () => {
    cy.get('[data-cy="copy_link_button"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should close extended area", () => {
    cy.get('[data-cy="close_extended_area"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.get('[data-cy="close_extended_area"]').should("not.exist");
  });
  it("should comment on product", () => {
    cy.intercept("GET", "**/api/v1/web/product/likesDetails/**").as(
      "SocialDataReq"
    );
    cy.get('[data-cy="CommentIcon"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@SocialDataReq").then((interceptions) => {
      expect(interceptions.response.statusCode).to.equal(200);
    });
    cy.get('[data-cy="CommentField"]').type("test comment");
    cy.intercept("POST", "**/api/v1/customer/product_comment").as(
      "SubmitCommentReq"
    );
    cy.get('[data-cy="SubmitComment"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@SubmitCommentReq").then((interceptions) => {
      expect(interceptions.response.statusCode).to.equal(200);
    });
    cy.get('[data-cy="close_extended_area"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should click on options button", () => {
    cy.intercept(
      "GET",
      "**/api/v1/web/notification_types/customer-notification-to-choose"
    ).as("NotificationsReq");
    cy.intercept(
      "GET",
      "**/api/v1/firebase_device_tokens/my_firebase_settings"
    ).as("FBNotificationsReq");
    cy.get('[data-cy="ThreePointsIcon"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait(["@NotificationsReq", "@FBNotificationsReq"]).then(
      (interceptions) => {
        expect(interceptions[0].response.statusCode).to.equal(200);
        expect(interceptions[1].response.statusCode).to.equal(200);
      }
    );
    cy.intercept("POST", "**/api/v1/firebase_device_tokens/subscribe_topic").as(
      "UpdateFBNotificationsReq"
    );
    cy.wait(3000);
    cy.get('[data-cy="notify-type"]').first().click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@UpdateFBNotificationsReq").then((interceptions) => {
      expect(interceptions.response.statusCode).to.equal(200);
    });
    cy.intercept(
      "POST",
      "**/api/v1/firebase_device_tokens/unsubscribe_topic"
    ).as("UnsubscribeFBNotificationsReq");
    cy.get('[data-cy="notify-type"]').first().click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@UnsubscribeFBNotificationsReq").then((interceptions) => {
      expect(interceptions.response.statusCode).to.equal(200);
    });
  });
});
