describe("Login Successful Attempt should login to 3 servers", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Undo Login Process", () => {
    cy.clickElement("[data-testid=take-look-text]");
    cy.log("✅✅ Undo Login Process");
  });
});
describe("Login Successful Attempt should login to 3 servers", () => {
  let UserName: string = "";
  let count = 0;
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On I Have Already Acount Button", () => {
    cy.HaveAccount();
  });
  it("Should Show By Mobile Phone Number Button (if the user try login from mobile phone)", () => {
    cy.ComplateLoginByMobilePhone();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963937764641");
  });
  it("Should Back & Change The Number", () => {
    cy.reEnterPhoneNumber("963937764641");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS And Store The User Name", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?**", (req) => {
      req.continue((res) => {
        UserName = res.body.data.user.name;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.wait("@verifyOtpSignin");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.EndLoginOperation;
  });
  it("Should Wait Login Request Until Arrives & Verification LogIn To Three Servers", () => {
    cy.RequestForThreeServers();
  });
  it("Should Verify User Name Apperead With Hello", () => {
    cy.get("[data-cy=NavUserName]")
      .invoke("text")
      .then((text) => {
        const username = text;
        expect(username).to.be.eq(UserName);
      });
  });
});
describe("Login UnSuccessful Attempt should show error message to user", () => {
  let count = 0;
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On I Have Already Acount Button", () => {
    cy.HaveAccount();
  });
  it("Should Show By Mobile Phone Number Button (if the user try login from mobile phone)", () => {
    cy.ComplateLoginByMobilePhone();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963937288307");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
  });
  it("Should Have Made Mistake In Entering The OTP Code", () => {
    cy.typePincode("499999");
    cy.log("❌❌ Type Pin Code Mistake Entred");
  });
  it("Should OTP Code Input Fields Be Colored Red After Incorrect Input ", () => {
    cy.ColoredFieldRed();
  });
  it("Should Click On Close icon", () => {
    cy.EndLoginOperation();
  });
});
describe("Login UnSuccessful Attempt when otp code expired & Change The Method To Recive Otp Code", () => {
  let count = 0;
  let UserName: string = "";
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On I Have Already Acount Button", () => {
    cy.HaveAccount();
  });
  it("Should Show By Mobile Phone Number Button (if the user try login from mobile phone)", () => {
    cy.ComplateLoginByMobilePhone();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963753159877");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
  });
  it("Should Wait Until OTP Code Becomes Expired", () => {
    cy.MakeOtpExpired();
  });
  it("Should Change The Way To Recive Otp Code", () => {
    cy.clickElement("[data-cy=Change-Way]");
    cy.get(".phone-send-options").should("be.visible");
  });
  it("Should Resend OTP Code & Recieve It By WattsApp", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.clickElement(".message-recieve-option:nth-child(1)");
    cy.log("✅✅ Recive Otp Code By WattsApp Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?**", (req) => {
      req.continue((res) => {
        UserName = res.body.data.user.name;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.wait("@verifyOtpSignin");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.EndLoginOperation();
  });
  it("Should Verify User Name Apperead With Hello", () => {
    cy.get("[data-cy=NavUserName]")
      .invoke("text")
      .then((text) => {
        const username = text;
        expect(username).to.be.eq(UserName);
      });
  });
});
describe("Login UnSuccessful Attempt when otp code expired should show button for resend otp and resend code and continue to login", () => {
  let count = 0;
  let UserName: string = "";
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On I Have Already Acount Button", () => {
    cy.HaveAccount();
  });
  it("Should Show By Mobile Phone Number Button (if the user try login from mobile phone)", () => {
    cy.ComplateLoginByMobilePhone();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963753159877");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
  });
  it("Should Verification Code Resend & Wait Until OTP Code Becomes Expired", () => {
    cy.MakeOtpExpired();
  });
  it("Should Click On Resend Button To Resend OTP Code", () => {
    cy.clickElement(".resend-code-button");
    cy.get(".resend-code-button").should("not.exist");
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?**", (req) => {
      req.continue((res) => {
        UserName = res.body.data.user.name;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.wait("@verifyOtpSignin");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.EndLoginOperation();
  });
  it("Should Verify User Name Apperead With Hello", () => {
    cy.get("[data-cy=NavUserName]")
      .invoke("text")
      .then((text) => {
        const username = text;
        expect(username).to.be.eq(UserName);
      });
  });
});
describe("Should show user not found when registering with non registered number", () => {
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On I Have Already Acount Button", () => {
    cy.HaveAccount();
  });
  it("Should Show By Mobile Phone Number Button (if the user try login from mobile phone)", () => {
    cy.ComplateLoginByMobilePhone();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963937764641");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = false;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      cy.log("✅ verifyOtpSignin request arrived");
    });
  });
  it("Should Apperead Not Registered Message", () => {
    cy.get(".not-registered", { timeout: 10000 }).should("be.visible");
  });
  it("Should Cancel & Look At The App", () => {
    cy.clickElement("[data-cy=Cancel-Look-App]");
  });
});
describe("Should Input name in login if the user does not input your name when sign up operation", () => {
  let UserName: string = "";
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On I Have Already Acount Button", () => {
    cy.HaveAccount();
  });
  it("Should Show By Mobile Phone Number Button (if the user try login from mobile phone)", () => {
    cy.ComplateLoginByMobilePhone();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963937764641");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.user.name = "";
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      cy.log("✅✅ verifyOtpSignin request arrived");
    });
  });
  it("Should Click On Input Field For Writ User Name", () => {
    cy.InputFieldNameVisible();
  });
  it("Should Writ User Name In The Input Field", () => {
    cy.TypeName();
  });
  it("Should Click On Arrow Founded In Right Of Input Field & Click On Skip For Now Button", () => {
    cy.ChexkExistElement("[data-testid=login-close-icon]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-testid=login-close-icon]");
        cy.log("✅✅ Skip For Now Button clicked");
      } else {
        cy.SkipForNow();
      }
    });
  });
  it("Should Verify User Name Apperead With Hello", () => {
    cy.get("[data-cy=NavUserName]")
      .invoke("text")
      .then((text) => {
        const username = text;
        // expect(username).to.be.eq(UserName);
      });
  });
});
describe.only("Should show user not found when registering with non registered number & Create New Account & Continue", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On I Have Already Acount Button", () => {
    cy.HaveAccount();
  });
  it("Should Show By Mobile Phone Number Button (if the user try login from mobile phone)", () => {
    cy.ComplateLoginByMobilePhone();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963937764641");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = false;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      cy.log("✅ verifyOtpSignin request arrived");
    });
  });
  it("Should Apperead Not Registered Message", () => {
    cy.get(".not-registered", { timeout: 10000 }).should("be.visible");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.clickElement("[data-cy=Create-New-Account]");
  });
  it("Should Click On Input Field For Writ User Name", () => {
    cy.InputFieldNameVisible();
  });
  it("Should Writ User Name In The Input Field", () => {
    cy.TypeName();
  });
  it("Should Click On Arrow Founded In Right Of Input Field & Click On Skip For Now Button", () => {
    cy.SkipForNow();
  });
});
