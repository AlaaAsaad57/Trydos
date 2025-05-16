describe("6-1 Open Stories After Login", () => {
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
    cy.intercept("GET", "**/api/v1/stories/users_stories").as("StoriesApi");
    cy.performLogin();
    cy.wait("@StoriesApi").then((interceptions) => {});
  });
  it("should Open First Story and Show Story Content", () => {
    cy.get("[data-cy=story-element]", { timeout: 5000 }).eq(0).click({
      scrollBehavior: false,
    });
    cy.get(".fixed-layout", { timeout: 5000 }).should("be.visible");
  });
  it("should when swipe right move to next story", () => {
    cy.wait(1000);
    // @ts-ignore
    cy.get(".fixed-layout").realSwipe("toLeft", {
      length: 500,
    });
    cy.wait(2000);
  });
  it("should Move To Previous Stories if Swipe Left if Not Already Closed", () => {
    cy.Exist(".fixed-layout").then((s) => {
      if (s) {
        // @ts-ignore
        cy.get(".fixed-layout").realSwipe("toRight", {
          length: 500,
        });
      }
    });
    cy.wait(2000);
  });
  it("Should Close Stories if its not Already Closed", () => {
    cy.Exist(".fixed-layout").then((s) => {
      if (s) {
        // @ts-ignore
        cy.get(".fixed-layout").realSwipe("toBottom", {
          length: 500,
        });
      }
    });
    cy.wait(1000);
    cy.Exist(".fixed-layout").then((s) => {
      if (!s) {
        cy.log("Stories Closed Successfully");
      }
    });
  });
});
describe("6-2 Should Upload Stories Successfully", () => {
  it("should Click On Add Story Button", () => {
    cy.get("[data-cy=Add-Story-Button]", { timeout: 5000 }).click({
      scrollBehavior: false,
      force: true,
    });
    cy.wait(1000);
  });
  it("should Select Gallery Options", () => {
    cy.get("[data-cy= Gallery-Photo-Option]", { timeout: 5000 }).click({
      scrollBehavior: false,
      force: true,
    });
    cy.wait(5000);
  });
  it("should Selct File Upload it and Add It To Stories", () => {
    cy.intercept("POST", "**/api/v1/stories/upload_story").as("UploadApi");
    // @ts-ignore
    cy.get("input[type=file]", { timeout: 5000 }).attachFile("images.jpeg");
    cy.get('[data-cy="link-story-input"]').type("http://www.AutoTest.com/");
    cy.get('[data-cy="share-story-button"]').click({ scrollBehavior: false });
    cy.wait("@UploadApi").then((s) => {
      expect(s.response.body.isSuccessful).to.be.equal(true);
    });
  });
});
describe("6-3 Should Ask For User Name if User Is Not Already Entered", () => {
  it("Should LogOut Before Procced", () => {
    cy.wait(1000);
    cy.logout();
  });
  it("should Login But Intercepting Request to Clear Name", () => {
    cy.intercept(
      "GET",
      "**/api/v1/auth/phone/verify_otp_from_guest?**",
      (req) => {
        req.continue((res) => {
          res.body.data.user.name = null;
        });
      }
    ).as("verifyOtpSignin");
    cy.performLogin();
  });
  it("should when click on Story Upload Button Show A Modal", () => {
    cy.get("[data-cy=Add-Story-Button]", { timeout: 5000 }).click({
      scrollBehavior: false,
      force: true,
    });

    cy.Exist("[data-cy=Input-Name]").then((s) => {
      expect(s).to.be.equal(true);
    });
  });
  it("should Enter A Valid Name And Update Name", () => {
    cy.intercept("POST", "**/customer/update-name").as("UpdateNameMarket");
    cy.intercept("POST", "**/api/v1/users/update").as("UpdateNameStories");
    cy.get("[data-cy=Input-Name]").type("Alaa Asaad");
    cy.get("[data-cy=Input-Name-Submit]").click({
      scrollBehavior: false,
      force: true,
    });
    cy.wait(["@UpdateNameMarket", "@UpdateNameStories"]).then((s) => {
      s.forEach((req) => {
        expect(req.response.statusCode === 200);
      });
    });
  });
});
