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
describe("8-2 should test edit profile photo", () => {
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
describe("8-3 should test update user info", () => {
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
describe("8-4 should change phone number and confirm it", () => {
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
describe("8-5 should test update size", () => {
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
describe("8-6 should test language and country change", () => {
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
describe("8-7 should test add/update address", () => {
  it("should click on profile button", () => {
    cy.get('[data-cy="profile-card"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should click on address button ", () => {
    cy.get('[data-cy="personal-address-button"]').click({
      scrollBehavior: false,
    });
  });
  it("should click on Add Address Button", () => {
    cy.intercept("POST", "**/GetViewportInfo").as("getViewportInfo");
    cy.get('[data-cy="AddAddres"').click({
      scrollBehavior: false,
    });
    cy.wait("@getViewportInfo");
  });
  it("should click on address List", () => {
    cy.get('[data-cy="Change-From-List"]').click({
      scrollBehavior: false,
    });
  });
  it("should intercepting address request", () => {
    cy.intercept("POST", "/api/addresses/get-address-by-text", (req) => {
      req.continue((res) => {
        res.body = {
          results: [
            {
              country: "syria",
              province: "Aleppo",
              city: "City center",
              town: "City center",
              street: null,
              building: "باب قنسرين",
              is_deliverable: 0,
              coordinates: [
                {
                  lat: 36.19465302718864,
                  lon: 37.15113296751566,
                },
                {
                  lat: 36.194588089640256,
                  lon: 37.15209856276102,
                },
                {
                  lat: 36.19445821438189,
                  lon: 37.153670337243746,
                },
                {
                  lat: 36.19429803459992,
                  lon: 37.155419137521456,
                },
              ],
            },
          ],
        };
      });
    }).as("getAddressByText");
    cy.get('[data-cy="SearchProvince-District-Town-Street"]').type(
      "Test Address",
      {
        force: true,
        scrollBehavior: false,
      }
    );
    cy.wait("@getAddressByText");
  });
  it("should select first address", () => {
    cy.get('[data-cy="Firstly-Search-Result"]').click({
      scrollBehavior: false,
    });
  });
  it("should type address Info", () => {
    cy.get('[data-cy="Detailed-Address-Note"] textarea').type(
      "Details Address Info",
      { scrollBehavior: false, force: true }
    );
    cy.get('[data-cy="add-address-input"]').type("Address Title Info", {
      scrollBehavior: false,
      force: true,
    });
    cy.get('[data-cy="recipient-name-input"]').type("Recipient Name Info", {
      scrollBehavior: false,
      force: true,
    });
    cy.get('[data-cy="Contact-Phone-input"]').type("963999999999", {
      scrollBehavior: false,
      force: true,
    });
  });
  it("should click on add button", () => {
    cy.intercept("POST", "**/address/add").as("AddAddressReq");
    cy.get('[data-cy="AddSaveButton"]').click({
      scrollBehavior: false,
      force: true,
    });
    cy.wait("@AddAddressReq");
  });
  it("should click on edit icon", () => {
    cy.get('[data-cy="Edit-Addres-Icon"]').eq(0).click({
      scrollBehavior: false,
    });
  });

  it("should type address Info", () => {
    cy.get('[data-cy="Detailed-Address-Note"] textarea').type(
      "Details Address Info Edit",
      { scrollBehavior: false, force: true }
    );
    cy.get('[data-cy="add-address-input"]').type("Address Title Info Edit", {
      scrollBehavior: false,
      force: true,
    });
    cy.get('[data-cy="recipient-name-input"]').type(
      "Recipient Name Info Edit",
      { scrollBehavior: false, force: true }
    );
    cy.get('[data-cy="Contact-Phone-input"]').type("9638888888888", {
      scrollBehavior: false,
      force: true,
    });
  });
  it("should click on Save button", () => {
    cy.intercept("POST", "**/address/update").as("UpdateAddressReq");
    cy.get('[data-cy="AddSaveButton"]').click({
      scrollBehavior: false,
      force: true,
    });
    cy.wait("@UpdateAddressReq");
  });
  it("should click on delete address", () => {
    cy.get('[data-cy="Delete-Address-Icon"]').eq(0).click({
      scrollBehavior: false,
    });
  });
  it("confirm should delete address", () => {
    cy.get('[data-cy="Yes-Delete-Address"]').click({
      scrollBehavior: false,
      force: true,
    });
  });
});
