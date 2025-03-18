describe("Login Successful Attempt should login to 3 servers", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  // *******************************Added Last*********************************************************
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
  it("Should Undo Login Process", () => {
    cy.clickElementForce("[data-testid=take-look-text]");
    cy.log("✅✅ Undo Login Process");
  });
});
// *******************************Added Last*********************************************************
describe("Login Successful Attempt should login to 3 servers", () => {
  let count = 0;
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
    cy.Exist1("[data-cy=login-method-phone]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
        cy.log("✅✅ The User Attempt LogIn From Mobile Phone");
      } else {
        cy.log("✅✅ User Does Not Attempt LogIn From Mobile Phone");
      }
    });
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber11("963937764641");
    cy.log("✅✅ Number Phone Entered Successfuly");
    cy.get('[data-testid="phone-number-input"]').should("not.be.focused");
  });
  // ***************************Added Last*********************************
  it("Should Back & Change The Number", () => {
    cy.reEnterPhoneNumber("963937764641");
  });
  // ***************************Added Last*********************************
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.get(".message-recieve-option:nth-child(2)").click({
      force: true,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.Exist1("[data-cy=WaitForTryAgain]").then((exist) => {
      if (exist) {
        cy.wait(60000);
        cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
        cy.get(".message-recieve-option:nth-child(2)").click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
        cy.wait("@sendOtpApi");
        cy.log("✅✅ Send Otp Api Request Successfuly");
      }
    });
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.get("[data-testid=login-close-icon]").click({
      force: true,
    });
  });
  it("Should Wait Login Request Until Arrives & Verification LogIn To Three Servers", () => {
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login");
    cy.intercept("GET", "**/api/v1/stories/users_stories", () => {
      count += 1;
    }).as("Stories");
    cy.wait("@login", { timeout: 10000 }).then((interception) => {
      cy.log("✅✅ login request arrived");
    });
    cy.wait("@Stories", { timeout: 10000 }).then((interception) => {
      cy.log("✅✅ Stories request arrived");
    });
    cy.wait(500).then(() => {
      cy.log(`Count is: ${count}`);
      expect(count).to.be.greaterThan(2);
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
    cy.Exist1("[data-cy=login-method-phone]").then((exist) => {
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
    cy.get(".message-recieve-option:nth-child(2)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.Exist1("[data-cy=WaitForTryAgain]").then((exist) => {
      if (exist) {
        cy.wait(60000);
        cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
        cy.get(".message-recieve-option:nth-child(2)").click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
        cy.wait("@sendOtpApi");
        cy.log("✅✅ Send Otp Api Request Successfuly");
      }
    });
  });
  it("Should Have Made Mistake In Entering The OTP Code", () => {
    cy.typePincode("499999");
    cy.log("✅✅ Type Pin Code Mistake Entred");
  });
  it("Should OTP Code Input Fields Be Colored Red After Incorrect Input ", () => {
    cy.get(".input-failed", { timeout: 5000 }).should("be.visible");
    cy.log("✅✅ OTP Code Input Fields Be Colored Red");
  });
  it("Should Click On Close icon", () => {
    cy.get("[data-testid=login-close-icon]").click({
      scrollBehavior: false,
    });
  });
  it("Should Fail Login Request", () => {
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login1");
    expect(count).to.be.equal(0);
    cy.get("@login1").then((exist) => {
      if (exist) {
        cy.wait("@login1", { timeout: 10000 }).then((interception) => {
          cy.log("✅✅ login request arrived");
        });
      } else {
        cy.log("���� login request not arrived");
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
    cy.Exist1("[data-cy=login-method-phone]").then((exist) => {
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
    cy.get(".message-recieve-option:nth-child(2)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.Exist1("[data-cy=WaitForTryAgain]").then((exist) => {
      if (exist) {
        cy.wait(60000);
        cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
        cy.get(".message-recieve-option:nth-child(2)").click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
        cy.wait("@sendOtpApi");
        cy.log("✅✅ Send Otp Api Request Successfuly");
      }
    });
  });
  it("Should Verification Code Resend & Wait Until OTP Code Becomes Expired", () => {
    cy.get("#text-wrap-element").should(
      "contain.text",
      "You Can Resend The Code After"
    );
    cy.get(".blue-text").should("be.visible");
    const EXPIRED_TIME = {
      seconds: 15,
      minutes: 0,
    };
    cy.wait(EXPIRED_TIME.seconds * 1000 + 5000);
    cy.get("#text-wrap-element").should(
      "contain.text",
      "Didn’t You Receive A Code?"
    );
  });
  it("Should Click On Resend Button To Resend OTP Code", () => {
    cy.Exist1(".resend-code-button").then((s) => {
      if (s) {
        cy.get(".resend-code-button").click({ scrollBehavior: false });
        cy.get(".resend-code-button").should("not.exist");
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
    cy.Exist1("[data-cy=login-method-phone]").then((exist) => {
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
    cy.get(".message-recieve-option:nth-child(2)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.Exist1("[data-cy=WaitForTryAgain]").then((exist) => {
      if (exist) {
        cy.wait(60000);
        cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
        cy.get(".message-recieve-option:nth-child(2)").click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
        cy.wait("@sendOtpApi");
        cy.log("✅✅ Send Otp Api Request Successfuly");
      }
    });
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = false;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
    cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      console.log(interception);
      cy.log("✅ verifyOtpSignin request arrived");
    });
  });
  it("Should Apperead Not Registered Message", () => {
    cy.get(".not-registered", { timeout: 10000 }).should("be.visible");
  });
  it("Should Cancel & Look At The App", () => {
    cy.get("[data-cy=Cancel-Look-App]").click({
      scrollBehavior: false,
    });
  });
});
// ********************************************AddedLast*************************************************************
describe("Should show user not found when registering with non registered number & Create New Account & Continue", () => {
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
    cy.Exist1("[data-cy=login-method-phone]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
        cy.log("✅✅ The User Attempt LogIn From Mobile Phone");
      } else {
        cy.log("✅✅ User Does Not Attempt LogIn From Mobile Phone");
      }
    });
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber1("963937288307");
    cy.log("✅✅ Number Phone Entered Successfuly");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.get(".message-recieve-option:nth-child(2)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.Exist1("[data-cy=WaitForTryAgain]").then((exist) => {
      if (exist) {
        cy.wait(60000);
        cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
        cy.get(".message-recieve-option:nth-child(2)").click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
        cy.wait("@sendOtpApi");
        cy.log("✅✅ Send Otp Api Request Successfuly");
      }
    });
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = false;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
    cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      console.log(interception);
      cy.log("✅ verifyOtpSignin request arrived");
    });
  });
  it("Should Apperead Not Registered Message", () => {
    cy.get(".not-registered", { timeout: 10000 }).should("be.visible");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.get("[data-cy=Create-New-Account]").click({
      scrollBehavior: false,
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
// *****************************************************************************************************************************
describe("Login UnSuccessful Attempt when otp code expired & Change The Method To Recive Otp Code", () => {
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
    cy.Exist1("[data-cy=login-method-phone]").then((exist) => {
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
    cy.get(".message-recieve-option:nth-child(2)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.Exist1("[data-cy=WaitForTryAgain]").then((exist) => {
      if (exist) {
        cy.wait(60000);
        cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
        cy.get(".message-recieve-option:nth-child(2)").click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
        cy.wait("@sendOtpApi");
        cy.log("✅✅ Send Otp Api Request Successfuly");
      }
    });
  });
  it("Should Wait Until OTP Code Becomes Expired", () => {
    const EXPIRED_TIME = {
      seconds: 15,
      minutes: 0,
    };
    cy.wait(EXPIRED_TIME.seconds * 1000 + 5000);
  });
  it("Should Change The Way To Recive Otp Code", () => {
    cy.clickElementForce("[data-cy=Change-Way]");
    cy.get(".phone-send-options").should("be.visible");
  });
  it("Should Click On Resend Button To Resend OTP Code", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.get(".message-recieve-option:nth-child(1)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By WattsApp Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
    cy.get(".resend-code-button").click({ scrollBehavior: false });
    cy.typePincode("999999");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.get("[data-testid=login-close-icon]").click({
      scrollBehavior: false,
    });
  });
});
// ***********************************************************************************
describe("Signup Successful Attempt should login to 3 servers", () => {
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
    cy.Exist1("[data-cy=login-method-phone]").then((exist) => {
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
    cy.get(".message-recieve-option:nth-child(2)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.Exist1("[data-cy=WaitForTryAgain]").then((exist) => {
      if (exist) {
        cy.wait(30000);
        cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
        cy.get(".message-recieve-option:nth-child(2)").click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
        cy.wait("@sendOtpApi");
        cy.log("✅✅ Send Otp Api Request Successfuly");
      }
    });
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.user.name = "";
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
    cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      console.log(interception);
      cy.log("✅ verifyOtpSignin request arrived");
    });
  });
  it("Should Click On Input Field For Writ User Name", () => {
    cy.clickElementForce("[data-cy=inputToWriteName]").should("be.visible");
    cy.log("✅✅ Input Field For Writ User Name is clicked on");
  });
  it("Should Writ User Name In The Input Field", () => {
    cy.get("[data-cy=InputFiledForName]", { timeout: 10000 })
      .type("Abdo Hamdan", { force: true })
      .should("have.value", "Abdo Hamdan"); // Ensure text was typed
    cy.log("✅✅ User Name is Writ In Input Field");
  });
  it("Should Click On Arrow Founded In Right Of Input Field & Click On Skip For Now Button", () => {
    cy.clickElementForce(".phone-arrow");
    cy.clickElementForce("[data-testid=login-close-icon]");
    cy.log("✅✅ Skip For Now Button clicked");
  });
});
