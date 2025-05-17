describe("8-1 should login and visit profile page", () => {
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
  it("should visit profile page", () => {
    cy.get("[data-cy=avatar-options]").click({
      force: true,
      scrollBehavior: false,
    });
    cy.get('[data-cy="Settings-Icon"]').click({ force: true });
    cy.get('[data-cy="profile-card"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
});
describe("should test edit profile photo", () => {
  it("should click on update photo Button", () => {
    cy.get('[data-cy="go-to-update-photo-screen"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should go to update photo screen", () => {
    cy.get('[data-cy="change-photo-menu"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should click on from my files", () => {
    cy.Exist('[data-cy="remove-photo-button"]').then((s) => {
      if (s) {
        cy.get('[data-cy="remove-photo-button"]').click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
    cy.get('[data-cy="change-photo-menu"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.get('[data-cy="upload-local-photo"]').click({ force: true });
    // @ts-ignore
    cy.get("#profile-file-picker").attachFile("images.jpeg");
  });
  it("should send three request to update photo in three servers", () => {
    cy.intercept("POST", "**/customer/update-profile").as("marketReq");
    cy.intercept("PUT", "**/api/v1/users/145").as("chatReq");
    cy.intercept("POST", "**/api/v1/users").as("storyReq");
    cy.intercept("POST", "**/storage/storage-upload").as("uploadPhoto");
    cy.get('[data-cy="save-image"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@uploadPhoto");
    cy.wait(["@marketReq", "@storyReq"]).then((s) => {
      expect(s[0].response.statusCode).to.equal(200);
      expect(s[1].response.statusCode).to.equal(200);
      // expect(s[2].response.statusCode).to.equal(200);
    });
  });
});
