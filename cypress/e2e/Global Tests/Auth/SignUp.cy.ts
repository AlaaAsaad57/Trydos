describe.only("Signup Successful Attempt should login to 3 servers", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  // *************************signupProcess********************
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On Create New Acount Button", () => {
    cy.CreateNewAccount();
  });
  it("Should Click On Agree & Countinue Button", () => {
    cy.AgreeTerms();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963937764641");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
    cy.get("[data-testid=pin-inputs-desc]", { timeout: 20000 });
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS & Wait Login Request Until Arrives & Verify Otp Signin To Three Servers", () => {
    let count = 0;
    cy.window().then((win) => {
      (win as any).stepIndicator = 5;
    });
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = false;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      cy.log("✅ verifyOtpSignin request arrived");
    });
    cy.RequestForThreeServers();
  });
  it("Should Click On Input Field For Writ User Name", () => {
    cy.InputFieldNameVisible();
  });
  it("Should Writ User Name In The Input Field", () => {
    cy.get('[data-cy="InputFiledForName"]').as("phoneInput").focus(); // Focus on the input
    cy.window().then((win) => {
      win.isKeyboardOpen = true;
    });
    cy.window().then((win) => {
      win.isKeyboardOpen = false;
      cy.get("@phoneInput").blur(); // Force blur event
      win.dispatchEvent(new Event("resize")); // Simulate a window resize event
    });
    cy.get("@phoneInput").should("not.be.focused", { timeout: 5000 });
    cy.TypeName();
    cy.interceptAndWait([
      {
        method: "POST",
        url: "**/api/v1/users/update",
        alias: "update",
      },
      {
        method: "POST",
        url: "**/api/new_v1/customer/update-name",
        alias: "updatename",
      },
    ]);
    cy.log("✅✅ updatename & updatename Requests Arrived");
  });
  it("Should Click On Arrow Founded In Right Of Input Field & Click On Skip For Now Button", () => {
    cy.SkipForNow();
  });
});
describe.only("Signup UnSuccessful Attempt should show error message to user", () => {
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On Create New Acount Button", () => {
    cy.CreateNewAccount();
  });
  it("Should Click On Agree & Countinue Button", () => {
    cy.AgreeTerms();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963937288307");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
    cy.get("[data-testid=pin-inputs-desc]", { timeout: 20000 });
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
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.EndLoginOperation();
  });
});
describe.only("Should show user is already registered when registering with registered number", () => {
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On Create New Acount Button", () => {
    cy.CreateNewAccount();
  });
  it("Should Click On Agree & Countinue Button", () => {
    cy.AgreeTerms();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963753159877");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
    cy.get("[data-testid=pin-inputs-desc]", { timeout: 20000 });
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS & Wait Login Request Until Arrives & Verify Otp Signin To Three Servers", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = true;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
    cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      cy.log("✅ verifyOtpSignin request arrived");
    });
    cy.get("[data-cy=already-registered-phone]").should("be.visible");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    // cy.EndLoginOperation;
    cy.get("[data-cy=Look-At-App]").click({
      scrollBehavior: false,
      force: true,
    });
  });
});
describe.only("Should show user is already registered when registering with registered number & Cancel & Take A Look At The App", () => {
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On Create New Acount Button", () => {
    cy.CreateNewAccount();
  });
  it("Should Click On Agree & Countinue Button", () => {
    cy.AgreeTerms();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963937288307");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
    cy.get("[data-testid=pin-inputs-desc]", { timeout: 20000 });
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
    cy.get("[data-testid=pin-inputs-desc]", { timeout: 20000 });
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS & Wait Login Request Until Arrives & Verify Otp Signin To Three Servers", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = true;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
    cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      cy.log("✅ verifyOtpSignin request arrived");
    });
    cy.get("[data-cy=already-registered-phone]").should("be.visible");
  });
  it("Should Cancel & Look At The App", () => {
    cy.clickElement("[data-cy=Look-At-App]");
  });
});
describe.only("Should show user is already registered when registering with registered number & Login & Continue", () => {
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On Create New Acount Button", () => {
    cy.CreateNewAccount();
  });
  it("Should Click On Agree & Countinue Button", () => {
    cy.AgreeTerms();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963753159877");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
    cy.get("[data-testid=pin-inputs-desc]", { timeout: 20000 });
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS & Wait Login Request Until Arrives & Verify Otp Signin To Three Servers", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = true;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
    cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      cy.log("✅ verifyOtpSignin request arrived");
    });
    cy.get("[data-cy=already-registered-phone]").should("be.visible");
  });
  it("Should Login & Countinue", () => {
    cy.clickElement("[data-cy=Login-Countinue]");
    cy.get("[data-cy=Wellcome-Enjoy]").should("be.visible");
  });
  it("Should Click On Close icon When Welcom Message Apperead", () => {
    cy.EndLoginOperation;
  });
});
// **************************************************************************************************************
describe.only("Signup Successful Attempt & complete the profile", () => {
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Click On Login Icon & Open Its Interface", () => {
    cy.OpenLoginInterface();
  });
  it("Should Click On Create New Acount Button", () => {
    cy.CreateNewAccount();
  });
  it("Should Click On Agree & Countinue Button", () => {
    cy.AgreeTerms();
  });
  it("Should Enter His Number In Number Entry Box", () => {
    cy.enterPhoneNumber("963937764641");
  });
  it("Should Click Recive Otp Code By SMS Button", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
    cy.get("[data-testid=pin-inputs-desc]", { timeout: 20000 });
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.CheckIfTrySendOtp();
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS & Wait Login Request Until Arrives & Verify Otp Signin To Three Servers", () => {
    let count = 0;
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login");
    cy.window().then((win) => {
      (win as any).stepIndicator = 5;
    });
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = false;
      });
    }).as("verifyOtpSignin");
    cy.typePincode("999999");
    cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
      cy.log("✅ verifyOtpSignin request arrived");
    });
    cy.wait("@login", { timeout: 10000 }).then((interception) => {
      cy.log("✅ login request arrived");
    });
    cy.wait(500).then(() => {
      cy.log(`Count is: ${count}`);
      expect(count).to.be.greaterThan(1);
    });
  });
  it("Should Click On Input Field For Writ User Name", () => {
    cy.InputFieldNameVisible();
  });
  it("Should Writ User Name In The Input Field", () => {
    cy.get('[data-cy="InputFiledForName"]').as("phoneInput").focus(); // Focus on the input
    cy.window().then((win) => {
      win.isKeyboardOpen = true;
    });
    cy.window().then((win) => {
      win.isKeyboardOpen = false;
      cy.get("@phoneInput").blur(); // Force blur event
      win.dispatchEvent(new Event("resize")); // Simulate a window resize event
    });
    cy.get("@phoneInput").should("not.be.focused", { timeout: 5000 });
    cy.TypeName();
  });
  it("Should Click On Arrow Founded In Right Of Input Field & Click On Complate My Profile Button", () => {
    cy.clickElement("[data-cy=Complate-Close]");
    cy.log("✅✅ Complate My Profile Button clicked");
  });
});
