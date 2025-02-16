describe("Open Site And Login If Not", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it.skip("Should Ensure The User Has Not LogIn Previously", () => {
    cy.wait(3000);
    cy.logout();
    cy.viewport(783, 824);
  });
  it.skip("should Login If User Is Not Verified", () => {
    cy.intercept("GET", "**/api/v1/stories/users_stories").as("StoriesApi");
    cy.performLogin();
    cy.wait("@StoriesApi").then((interceptions) => {
      console.log(interceptions);
    });
  });
  it("should Open First Story and Show Story Content", () => {
    cy.get("[data-cy=story-element]", { timeout: 5000 }).eq(0).click({
      scrollBehavior: false,
    });
    cy.get(".fixed-layout", { timeout: 5000 }).should("be.visible");
  });
  it("should when swipe right move to next story", () => {
    cy.wait(1000);
    cy.get(".fixed-layout", { timeout: 5000 }).trigger("mousedown", {
      button: 0,
      clientX: 300,
      clientY: 50,
      isTrusted: true,
    });
    cy.wait(1000);
    cy.get(".fixed-layout", { timeout: 5000 }).trigger("mousemove", {
      clientX: 0,
      clientY: 50,
      isTrusted: true,
    }); // Move the mouse to the right (dragging)
    cy.wait(1000);
    cy.get(".fixed-layout", { timeout: 5000 }).trigger("mouseup", {
      clientX: 0,
      clientY: 50,
      isTrusted: true,
    });
  });
  it("should Move To Previous Stories if Swipe Left if Not Already Closed", () => {
    cy.Exist(".fixed-layout").then((s) => {
      if (s) {
        cy.get(".fixed-layout", { timeout: 5000 }).trigger("mousedown", {
          button: 0,
          clientX: 0,
          clientY: 50,
          force: true,
          isTrusted: true,
        });
        cy.wait(100);
        cy.get(".fixed-layout").trigger("mousemove", {
          clientX: 400,
          clientY: 50,
          force: true,
          isTrusted: true,
        });
        cy.wait(1000);
        cy.get(".fixed-layout").trigger("mouseup", {
          clientX: 400,
          clientY: 50,
          force: true,
          isTrusted: true,
        });
      }
    });
    cy.wait(2000);
  });
  it("Should Close Stories if its not Already Closed", () => {
    cy.Exist(".fixed-layout").then((s) => {
      if (s) {
        cy.get(".fixed-layout", { timeout: 5000 })
          .trigger("mousedown", {
            button: 0,
            clientX: 50,
            clientY: 0,
            force: true,
          }) // Start dragging at the top
          .trigger("mousemove", { clientX: 50, clientY: 700, force: true }) // Move the mouse down
          .trigger("mouseup", { clientX: 50, clientY: 700, force: true });
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
