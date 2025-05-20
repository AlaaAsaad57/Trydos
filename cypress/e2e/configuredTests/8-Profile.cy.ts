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
    cy.intercept("PUT", "**/api/v1/users/*").as("chatReq");
    cy.intercept("POST", "**/api/v1/users/update").as("storyReq");
    cy.intercept("POST", "**/storage/storage-upload").as("uploadPhoto");
    cy.get('[data-cy="save-image"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@uploadPhoto");
    cy.wait(["@marketReq", "@storyReq", "@chatReq"]).then((s) => {
      expect(s[0].response.statusCode).to.equal(200);
      expect(s[1].response.statusCode).to.equal(200);
      expect(s[2].response.statusCode).to.equal(200);
    });
  });
});
describe("should test update user info", () => {
  it("should back to profile page", () => {
    cy.get('[data-cy="save-image-back-button"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should click on Info Button", () => {
    cy.get('[data-cy="personal-info-button"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should edit name", () => {
    cy.get('[data-cy="personal-info-recipient-name-input"]').clear();
    cy.get('[data-cy="personal-info-recipient-name-input"]').type(
      `Test Name ${Math.floor(Math.random() * 9000) + 1000}`
    );
  });
  it("should edit alternative phone number", () => {
    cy.get('[data-cy="personal-info-alternative-phone-number-input"]').clear();
    cy.get('[data-cy="personal-info-alternative-phone-number-input"]').type(
      `${Math.floor(Math.random() * 9000) + 1000}`
    );
  });
  it("should edit email", () => {
    cy.get('[data-cy="personal-info-Contact-email-input"]').clear();
    cy.get('[data-cy="personal-info-Contact-email-input"]').type(
      `TestEmail${Math.floor(Math.random() * 9000) + 1000}@gmail.com`
    );
  });
  it("should select different gender options", () => {
    // Select Man
    cy.get('[data-cy="gender-input"]').first().click({ force: true });
  });
});
describe("should change phone number and confirm it", () => {
  it("should click on phone number input", () => {
    cy.get('[data-cy="personal-info-phone-number-input"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should change phone number", () => {
    let numbers = ["963999999309", "963999999308"];
    cy.get('[data-cy="personal-info-phone-number-input"]').then(($input) => {
      const currentValue = $input.val();
      const newValue = currentValue === numbers[0] ? numbers[1] : numbers[0];
      cy.wrap($input).clear();
      cy.wrap($input).invoke("val", "");
      cy.wrap($input).type(`${newValue}`);
    });
  });
  it("should click on save", () => {
    cy.get('[data-cy="personal-info-save-button"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should confirm number", () => {
    cy.intercept("POST", "**/customer/update-profile").as("marketReq");
    cy.intercept("PUT", "**/api/v1/users/*").as("chatReq");
    cy.intercept("POST", "**/api/v1/users/update").as("storyReq");
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
    cy.CheckIfTrySendOtp();
    cy.typePincode("999999");
    // cy.wait(["@marketReq", "@storyReq", "@chatReq"]).then((s) => {
    //   expect(s[0].response.statusCode).to.equal(200);
    //   expect(s[1].response.statusCode).to.equal(200);
    //   expect(s[2].response.statusCode).to.equal(200);
    // });
  });
});
describe("should test update size", () => {
  it("should back to profile screen", () => {
    cy.get('[data-cy="personal-info-save-button-back-button"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should click on size button", () => {
    cy.get('[data-cy="personal-size-button"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should edit tall and weight", () => {
    cy.get('[data-cy="personal-size-tall-input"]').clear();
    cy.get('[data-cy="personal-size-tall-input"]').type("180");
    cy.get('[data-cy="personal-size-weight-input"]').clear();
    cy.get('[data-cy="personal-size-weight-input"]').type("70");
  });
  it("should click on save button", () => {
    cy.intercept("POST", "**/customer/update-profile").as("marketReq");
    cy.intercept("PUT", "**/api/v1/users/*").as("chatReq");
    cy.intercept("POST", "**/api/v1/users/update").as("storyReq");
    cy.get('[data-cy="personal-size-save-button"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait(["@marketReq", "@storyReq", "@chatReq"]).then((s) => {
      expect(s[0].response.statusCode).to.equal(200);
      expect(s[1].response.statusCode).to.equal(200);
      expect(s[2].response.statusCode).to.equal(200);
    });
  });
  it("should back to profile screen", () => {
    cy.get('[data-cy="personal-size-save-button-back-button"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
});
describe("should test language and country change", () => {
  it("should back to profile screen", () => {
    cy.get('[data-cy="profile-back-button"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should click on country button", () => {
    cy.get('[data-cy="country-button"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.get('[data-cy="personal-info-countries-SY"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.Exist('[data-cy="personal-info-countries-back-button"]').then((s) => {
      if (s) {
        cy.get('[data-cy="personal-info-countries-back-button"]').click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
  it("should click on language button", () => {
    cy.get('[data-cy="language-button"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.get('[data-cy="language-en"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.Exist('[data-cy="language-setting-back-button"]').then((s) => {
      if (s) {
        cy.get('[data-cy="language-setting-back-button"]').click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
  });
});
describe("should test update address", () => {});
