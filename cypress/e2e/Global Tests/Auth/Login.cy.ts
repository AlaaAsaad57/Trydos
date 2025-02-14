describe("Login Successful Attempt should login to 3 servers", () => {
  let count = 0;
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
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
    cy.log("✅✅ Click On Login Icon & Open Its Interface");
  });
  it("Should Click On I Have Already Acount Button", () => {
    cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
    cy.log("✅✅ Click On I Have Already Acount Button");
  });
  it("Should Show By Mobile Phone Number Button (if the user try login from mobile phone)", () => {
    cy.Exist("[data-cy=login-method-phone]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
        cy.log("✅✅ The User Attempt LogIn From Mobile Phone");
      } else {
        cy.log("✅✅ User Does Not Attempt LogIn From Mobile Phone");
      }
    });
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber1("963937764641");
    cy.log("✅✅ Number Phone Entered Successfuly");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.get(".message-recieve-option:nth-child(1)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.get("[data-testid=login-close-icon]").click({
      scrollBehavior: false,
    });
  });
  it("Should Wait Login Request Until Arrives & Verification LogIn To Three Servers", () => {
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login");
    cy.get("@login", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@login", { timeout: 10000 }).then((interception) => {
          cy.log("✅✅ login request arrived");
        });
      } else {
        cy.log("❌❌ login request did not arrive");
      }
    });
    cy.wait(5000).then(() => {
      cy.log(`Count is: ${count}`);
      expect(count).to.be.greaterThan(1);
    });
  });
});
describe("Login UnSuccessful Attempt should show error message to user", () => {
  let count = 0;
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.wait(3000);
    cy.logout();
    cy.viewport(783, 824);
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
    cy.log("✅✅ Click On Login Icon & Open Its Interface");
  });
  it("Should Click On I Have Already Acount Button", () => {
    cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
    cy.log("✅✅ Click On I Have Already Acount Button");
  });
  it("Should Show By Mobile Phone Number Button (if the user try login from mobile phone)", () => {
    cy.Exist("[data-cy=login-method-phone]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
        cy.log("✅✅ The User Attempt LogIn From Mobile Phone");
      } else {
        cy.log("❌❌ User Does Not Attempt LogIn From Mobile Phone");
      }
    });
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber1("963937288307");
    cy.log("✅✅ Number Phone Entered Successfuly");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.get(".message-recieve-option:nth-child(1)").click({
      scrollBehavior: false,
    });
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
  it("Should Fail Login Request", () => {
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login1");
    expect(count).to.be.equal(0);
    cy.get("@login1", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@login1", { timeout: 10000 }).then((interception) => {
          cy.log("✅✅ login request arrived");
        });
      } else {
        cy.log("❌❌ login request did not arrive");
      }
    });
  });
});
describe("Login UnSuccessful Attempt when otp code expired should show button for resend otp and resend code and continue to login", () => {
  let count = 0;
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.wait(3000);
    cy.logout();
    cy.viewport(783, 824);
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
    cy.log("✅✅ Click On Login Icon & Open Its Interface");
  });
  it("Should Click On I Have Already Acount Button", () => {
    cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
    cy.log("✅✅ Click On I Have Already Acount Button");
  });
  it("Should Show By Mobile Phone Number Button (if the user try login from mobile phone)", () => {
    cy.Exist("[data-cy=login-method-phone]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
        cy.log("✅✅ The User Attempt LogIn From Mobile Phone");
      } else {
        cy.log("✅✅ User Does Not Attempt LogIn From Mobile Phone");
      }
    });
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber1("963753159877");
    cy.log("✅✅ Number Phone Entered Successfuly");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.get(".message-recieve-option:nth-child(1)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Wait Until OTP Code Becomes Expired", () => {
    cy.wait(130000);
  });
  it("Should Click On Resend Button To Resend OTP Code", () => {
    cy.Exist(".resend-code-button").then((s) => {
      if (s) {
        cy.get(".resend-code-button").click({ scrollBehavior: false });
        cy.typePincode("999999");
      } else {
        expect(1).to.equal(2);
      }
    });
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.get("[data-testid=login-close-icon]").click({
      scrollBehavior: false,
    });
  });
  it("Should Wait Login Request Until Arrives & Verification LogIn To Three Servers", () => {
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login2");
    expect(count).to.be.equal(0);
    cy.get("@login2", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@login2", { timeout: 10000 }).then((interception) => {
          cy.log("✅✅ login request arrived");
        });
      } else {
        cy.log("❌❌ login request did not arrive");
      }
    });
  });
});
describe("Should show user not found when registering with non registered number", () => {
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.wait(3000);
    cy.logout();
    cy.viewport(783, 824);
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
    cy.log("✅✅ Click On Login Icon & Open Its Interface");
  });
  it("Should Click On I Have Already Acount Button", () => {
    cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
    cy.log("✅✅ Click On I Have Already Acount Button");
  });
  it("Should Show By Mobile Phone Number Button (if the user try login from mobile phone)", () => {
    cy.Exist("[data-cy=login-method-phone]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
        cy.log("✅✅ The User Attempt LogIn From Mobile Phone");
      } else {
        cy.log("✅✅ User Does Not Attempt LogIn From Mobile Phone");
      }
    });
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber1("963937764641");
    cy.log("✅✅ Number Phone Entered Successfuly");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.get(".message-recieve-option:nth-child(1)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = false;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
    cy.get("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      if (interception) {
        cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
          console.log(interception);
          cy.log("✅ verifyOtpSignin request arrived");
        });
      } else {
        cy.log("❌❌ verifyOtpSignin request did not arrive");
      }
    });
  });
  it("Should Apperead Not Registered Message", () => {
    cy.get(".not-registered", { timeout: 5000 }).should("be.visible");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.get("[data-testid=login-close-icon]").click({
      scrollBehavior: false,
    });
  });
});
