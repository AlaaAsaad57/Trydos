describe("Signup Successful Attempt should login to 3 servers", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  // *************************signupProcess********************
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.wait(3000);
    cy.logout();
    cy.viewport(783, 824);
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.clickElementScroll(".en-regular:nth-child(2)");
    cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
    cy.log("✅✅ Click On Login Icon & Open Its Interface");
  });
  it("Should Click On Create New Acount Button", () => {
    cy.clickElementScroll(".login-button:nth-child(2)");
    cy.log("✅✅ Click On Create New Acount Button");
  });
  it("Should Click On Agree & Countinue Button", () => {
    cy.clickElementForce(".agree-terms");
    cy.log("✅✅ Agree & Countinue Button Clicked Successfuly");
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber1("963937764641");
    cy.log("✅✅ Number Phone Entered Successfuly");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.clickElementScroll(".message-recieve-option:nth-child(1)");
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS & Wait Login Request Until Arrives & Verify Otp Signin To Three Servers", () => {
    let count = 0;
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = false;
      });
    }).as("verifyOtpSignin");
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login");
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
    cy.get("@verifyOtpSignin", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
          console.log(interception);
        });
      } else {
        console.warn("❌❌ verifyOtpSignin alias does not exist");
      }
    });
    cy.wait(5000).then(() => {
      cy.log(`Count is: ${count}`);
      expect(count).to.be.greaterThan(0);
    });
    cy.get("@login", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@login", { timeout: 10000 }).then((interception) => {
          cy.log("✅ login request arrived");
        });
      } else {
        cy.log("❌❌ login request did not arrive");
      }
    });
  });
  it("Should Click On Input Field For Writ User Name", () => {
    cy.clickElementForce("[data-cy=inputToWriteName]");
    cy.log("✅✅ Input Field For Writ User Name is clicked on");
  });
  it("Should Writ User Name In The Input Field", () => {
    cy.get("[data-cy=InputFiledForName]", { timeout: 10000 })
      .type("Abdo Hamdan", { force: true })
      .should("have.value", "Abdo Hamdan"); // Ensure text was typed
    cy.log("✅✅ User Name is Writ In Input Field");
  });
  it("Should Click On Arrow Founded In Right Of Input Field & Click On Skip For Now Button", () => {
    cy.get(".phone-arrow").click({ scrollBehavior: false });
    cy.clickElementForce("[data-cy=skipForNow]");
    cy.log("✅✅ Skip For Now Button clicked");
  });
});
// *************************failedSignupProcess**********************************
describe("Signup UnSuccessful Attempt should show error message to user", () => {
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.wait(3000);
    cy.logout();
    cy.viewport(783, 824);
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.clickElementScroll(".en-regular:nth-child(2)");
    cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
    cy.log("✅✅ Click On Login Icon & Open Its Interface");
  });
  it("Should Click On Create New Acount Button", () => {
    cy.clickElementScroll(".login-button:nth-child(2)");
    cy.log("✅✅ Click On Create New Acount Button");
  });
  it("Should Click On Agree & Countinue Button", () => {
    cy.clickElementForce(".agree-terms");
    cy.log("✅✅ Agree & Countinue Button Clicked Successfuly");
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber1("963937288307");
    cy.log("✅✅ Number Phone Entered Successfuly");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.clickElementScroll(".message-recieve-option:nth-child(1)");
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Have Made Mistake In Entering The OTP Code", () => {
    cy.typePincode("499999");
    cy.log("✅✅ Type Pin Code Mistake Entred");
  });
  it("Should OTP Code Input Fields Be Colored Red After Incorrect Input ", () => {
    cy.get(".input-failed", { timeout: 5000 }).should("be.visible");
    cy.log("✅✅ OTP Code Input Fields Be Colored Red");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.get("[data-testid=login-close-icon]").click({
      scrollBehavior: false,
    });
  });
});
// *************************alreadyRegisteredSignup******************************
describe("Should show user is already registered when registering with registered number", () => {
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.wait(3000);
    cy.logout();
    cy.viewport(783, 824);
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.clickElementScroll(".en-regular:nth-child(2)");
    cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
    cy.log("✅✅ Click On Login Icon & Open Its Interface");
  });
  it("Should Click On Create New Acount Button", () => {
    cy.clickElementScroll(".login-button:nth-child(2)");
    cy.log("✅✅ Click On Create New Acount Button");
  });
  it("Should Click On Agree & Countinue Button", () => {
    cy.clickElementForce(".agree-terms");
    cy.log("✅✅ Agree & Countinue Button Clicked Successfuly");
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber1("963753159877");
    cy.log("✅✅ Number Phone Entered Successfuly");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.clickElementScroll(".message-recieve-option:nth-child(1)");
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS & Wait Login Request Until Arrives & Verify Otp Signin To Three Servers", () => {
    let count = 0;
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = true;
      });
    }).as("verifyOtpSignin");
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login");
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
    cy.get("@verifyOtpSignin", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
          console.log(interception);
        });
      } else {
        console.warn("❌❌ verifyOtpSignin alias does not exist");
      }
    });
    cy.wait(5000).then(() => {
      cy.log(`Count is: ${count}`);
    });
    cy.get("@login", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@login", { timeout: 10000 }).then((interception) => {
          cy.log("✅ login request arrived");
        });
      } else {
        cy.log("❌❌ login request did not arrive");
      }
    });
  });
});
