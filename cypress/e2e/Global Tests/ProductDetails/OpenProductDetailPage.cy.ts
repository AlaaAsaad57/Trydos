describe("Should Open The Boutique Page & Move From It To A Product Page From The Boutique", () => {
  before("Should Open The Trydos & Verify Boutiques Are Loaded", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.log("✅✅ Boutiues Founded & Loaded In Main Page");
  });
  it("Should Select Any Boutique & Click On", () => {
    cy.clickElementForce(".offer-widget:nth-child(5)");
    cy.log("✅✅ An Boutique Selected & Click");
  });
  it("Should Verify Products ", () => {
    cy.get("[data-cy=boutiqueOpen]", { timeout: 20000 });
    cy.log("✅✅ The Boutique's Components Were Successfully Displayed");
    cy.get("[data-cy=boutique_top_info]", { timeout: 20000 });
    cy.log("✅✅ The Selected Boutique Page Has Opened");
    cy.verifyBoxsInBoutiquePage();
    cy.get("[data-cy=allCategory]", { timeout: 20000 });
    cy.log("✅✅ There Are Products On This Boutique Page");
  });
  it("Should Check The Components Of The Product Display Card (Product Name, Price, Purchase Button)", () => {
    cy.verifyComponentsInProductCard();
  });
});
// *************************************one*********************************************
describe("Should Open Product Page", () => {
  it("Should Choose The First Product From The Products On The Boutique Page & Open His Page", () => {
    cy.get("[data-cy=on_mouse_over_product]").eq(0).click({ force: true });
    cy.log(
      "✅✅ The Card Of The First Product Is Clicked & The Page Of Product Is Opned"
    );
  });
  it("Should Choose The First Product From The Products On The Boutique Page & Open His Page", () => {
    // cy.wait(5000);
    cy.get(".embla__slide")
      .its("length")
      .then((count) => {
        cy.log(`There Are Stories About The Product & Count It Is: ${count}`);
        if (count >= 2) {
          cy.wait(5000);
          cy.get(".embla__slide").eq(1).click({ force: true });
          cy.log("✅✅ Secondly Stories Chooses And Clicked");
          // cy.Exist("[data-cy=close_stories_icon]").then((exist) => {
          // if (exist) {
          cy.clickElementForce("[data-cy=close_stories_icon]");
          cy.log("✅✅ Close Stories Icon Clicked");
          // }
          // });
        }
      });
  });
});
// *************************************two*********************************************
describe("Read More / Read Less Button Test", () => {
  it("toggles between Read More and Read Less correctly", () => {
    cy.get(".read-more").contains("Read More").should("be.visible");
    cy.log("✅✅ Read More Button Founded");
    cy.get(".read-more").contains("Read More").click();
    cy.log("✅✅ Read More Button Clicked");
    cy.get(".read-more").contains("Read More").should("not.exist");
    cy.log("✅✅ Read More Button Disapperead");
    cy.get(".read-more").contains("Read Less").should("be.visible");
    cy.log("✅✅ Read Less Button Founded");
    cy.get(".product-details-text #details")
      .invoke("text")
      .should("not.contain", "...");
    cy.get(".read-more").contains("Read Less").click();
    cy.log("✅✅ Read Less Button Clicked");
    cy.get(".read-more").contains("Read Less").should("not.exist");
    cy.log("✅✅ Read Less Button Disapperead");
    cy.get(".read-more").contains("Read More").should("be.visible");
    cy.log("✅✅ Read More Button Reapperead");
    cy.get(".product-details-text #details")
      .invoke("text")
      .should("contain", "...");
  });
});
// *************************************three*********************************************
describe("Product Properties Section", () => {
  it("displays product properties correctly", () => {
    cy.get(".product-properties").should("be.visible");
    cy.log("✅✅ Product Properties Row Displayed");
    cy.get(".product-property-row").should("have.length", 3);
    cy.log("✅✅ Product Properties Row Displayed & Countains 3 Properties");
    cy.get(".product-property-row")
      .eq(0)
      .should("contain.text", "Good Quality Product")
      .find("svg")
      .should("exist");
    cy.get(".product-property-row")
      .eq(1)
      .should("contain.text", "Verified by trydos")
      .find("svg")
      .should("exist");
    cy.get(".product-property-row")
      .eq(2)
      .should("contain.text", "Made In")
      .find("svg")
      .should("exist");
    cy.log("✅✅ All Properties Displayed & ");
  });
});
// *************************************four*********************************************
describe("Should Verify Available Colors Of The Product & Navigate Between Product Images", () => {
  it("Should Display The Available Color Box (Icon, Span, QuestionMark)", () => {
    cy.get('[data-cy="AvailableColor"]').should("be.visible");
    cy.log("✅✅ The Available Color Section Found");
    cy.get('[data-cy="ColorsIcon"]').should("be.visible");
    cy.log("✅✅ The Colors Icon Found");
    cy.get('[data-cy="AvailableColor"]').each(($el, index) => {
      cy.wrap($el).then(() => {
        cy.get(".colors-label span").each(($el) => {
          cy.wrap($el)
            .invoke("text")
            .then((text) => {
              const cleanedText = text.trim().replace(/\s+/g, " ");
              cy.log(`✅✅ Color Label Text: "${cleanedText}"`); // Print each text
            });
        });
      });
    });
  });
  it("Should Check Swipper Photo & Click On An Photo", () => {
    cy.get('[data-cy="SwiperPhoto"]').should("be.visible");
    cy.log("✅✅ Swiper Photo Displayed");
    cy.get('[data-cy="SwiperPhoto"]').eq(0).click({ force: true });
    cy.log("✅✅ First Swiper Photo Clicked");
    cy.get('[data-cy="AfterClickOnSwipperPhoto"]').should("be.visible");
    cy.log("✅✅ Container Of Swiper Photo Displayed");
  });
});
// *************************************five*********************************************
describe("Should Click On Each QuestionMark Component & Read InfoWindow Text", () => {
  it("Should Verify & Click On QuestionMark Component and Read InfoWindow Text", () => {
    cy.get("[data-cy=QuestionMark]").each(($el, index) => {
      cy.wrap($el)
        .click({ force: true })
        .then(() => {
          cy.get("[data-cy=InfoWindow]")
            .invoke("text")
            .then((text) => {
              cy.log(`InfoWindow ${index + 1}: ${text}`);
              cy.get("body").click(0, 0);
            });
        });
    });
    cy.get("body").click(0, 0);
  });
});
// *************************************six*********************************************
describe("Should Open Camera 12 Shot Picture", () => {
  it("Should Verify Swipper Photo1", () => {
    cy.get('[data-cy="CameraIcon"]').should("be.visible");
    cy.log("✅✅ Camera Icon Displayed");
    cy.get('[data-cy="SwiperPhoto1"]').should("be.visible");
    cy.log("✅✅ Swiper Photo1 Displayed");
    cy.get('[data-cy="SwiperPhoto1"]').eq(0).click({ force: true });
    cy.log("✅✅ First Swiper Photo1 Clicked");
  });
  it("Should Check Whether The Image Interface Exists", () => {
    cy.get('[data-cy="ActiveCaneraGallery"]').should("be.visible");
    cy.log("✅✅ Active Canera Gallery Displayed");
    cy.get('[data-cy="GalleryItems"]').should("be.visible");
    cy.log("✅✅ Gallery Items Displayed");
  });
  it("Should Choose Any Photo", () => {
    cy.get('[data-cy="GalleryChooseItem"]').should("be.visible");
    cy.log("✅✅ Gallery Choose Item Displayed");
    cy.get('[data-cy="GalleryChooseItem"]').eq(0).click({ force: true });
    cy.log("✅✅ Firstly Gallery Choose Item Clicked");
  });
  it("Should Check Whether User Interaction Box & Get Number Of Love Interactions", () => {
    cy.get('[data-cy="UserInteractions"]').should("be.visible");
    cy.log("✅✅ User Interactions Displayed");
    cy.get('[data-cy="CountOfUserInteractions"]').eq(0).scrollIntoView();
    cy.log("✅✅ Box Interactions Displayed");
    cy.get('[data-cy="CountOfLoved"]')
      .eq(0)
      .invoke("text")
      .then((count) => {
        cy.log(`✅✅ User Loves Interactions Is: ${count}`);
      });
    cy.log("✅✅ Count Of User Interactions Displayed");
  });
  it("Should Check Whether Info Box & Close Image Interface", () => {
    cy.get('[data-cy="ProductsDetail&Info"]').eq(0).scrollIntoView();
    cy.log("✅✅ Products Detail & Info Displayed");
    cy.get('[data-cy="ToClose"]').eq(0).click({ force: true });
    cy.log("✅✅ Icon For Close Clicked");
    cy.get("body").click(0, 0);
  });
});
// *************************************seven*********************************************
describe("Should Open last Story", () => {
  it("Should Click On Last Story & Close it", () => {
    cy.get('[data-cy="StoriesIcon"]').should("be.visible");
    cy.log("✅✅ Stories Icon Displayed");
    cy.get("[data-cy=Story]").last().click({ force: true });
    cy.log("✅✅ The Last Story Opened");
    cy.get(".story-holder").should("be.visible").first().as("story");
    cy.get("@story").then(($el) => {
      const rect = $el[0].getBoundingClientRect(); // Get position & size
      cy.wrap($el)
        .trigger("mousedown", {
          clientX: rect.x + rect.width / 2,
          clientY: rect.y - 10,
          force: true,
        })
        .trigger("mousemove", {
          clientX: rect.x + rect.width / 2,
          clientY: rect.y + rect.height + 10,
          force: true,
        })
        .trigger("mouseup", { force: true });
      cy.wait(10000);
    });
  });
});
// *************************************eight*********************************************
describe("Should Verify Available Sizes Of The Product & Check Count Of Sizes", () => {
  let SizeCount1: number = 0;
  it("Should Check Whether About Size Box", () => {
    cy.get('[data-cy="SizeIcon"]').should("be.visible");
    cy.log("✅✅ Size Icon Displayed");
    cy.get("[data-cy=SizeSpan]")
      .invoke("text")
      .then((text) => {
        const match = text.match(/\d+/);
        if (match) {
          const sizeCount = parseInt(match[0], 10);
          SizeCount1 = sizeCount;
          cy.log(`Extracted size count: ${sizeCount}`);
          expect(sizeCount).to.be.a("number");
        }
      });
  });
  it("Should Check Whether About Size Circle", () => {
    cy.get('[data-cy="SizeBox"]').should("be.visible");
    cy.log("✅✅ Size Box Displayed");
    cy.get('[data-cy="ElementOnSizeBox"]').eq(0).click({ force: true });
    cy.log("✅✅ Element On Size Box Clicked");
    cy.get('[data-cy="SizeSliderBox"]').should("be.visible");
    cy.log("✅✅ Size Slider Box Displayed");
    cy.get('[data-cy="SizeCircle"]').should("be.visible");
    cy.log("✅✅ Size Circle Displayed");
    cy.get("[data-cy=SizeCircle]")
      .its("length")
      .then((count) => {
        cy.log(`The Count Of Size Circle Is: ${count}`);
        if (SizeCount1 === count) {
          cy.log("✅✅ Count Of Size Circle Matched Available Sizes");
        } else {
          cy.log("❌❌ Count Of Size Circle Not Matched Available Sizes");
        }
      });
  });
  it("Should Check Whether About Boxes Below Size Circle", () => {
    cy.get('[data-cy="RecommendedHelp"]').should("be.visible");
    cy.log("✅✅ Recommended Help Box Displayed");
    cy.get('[data-cy="SizeInfoBoxAboutRecommend"]').should("be.visible");
    cy.log("✅✅ Size Info Box About Recommend Box Displayed");
    cy.get('[data-cy="ProductShiping"]').should("be.visible");
    cy.log("✅✅  Product Shiping Displayed");
  });
});
// *************************************nine*********************************************
describe("Should Verify Product Shipping & Delivery", () => {
  it("Should Verify About Product Shipping & Delivery Displayed", () => {
    cy.get('[data-cy="ProductShiping"]').click({ force: true });
    cy.log("✅✅ Product Shiping Box Clicked");
  });
  it("Should Verify About Boxes Apperead Below Product Shipping & Delivery", () => {
    cy.get('[data-cy="AddresInfo"]').should("be.visible");
    cy.get('[data-cy="AddresInfo1"]').should("be.visible");
    cy.get('[data-cy="AddresInfo2"]').should("be.visible");
    cy.get('[data-cy="GreenLabel"]').should("be.visible");
    cy.log("✅✅ All Addres Info Boxes Displayed");
    cy.get('[data-cy="ProductShiping"]').click({ force: true });
  });
});
// *************************************ten*********************************************
describe("Should Verify About Free Shiping & Free Return ", () => {
  it("Should Verify About Product Shipping & Delivery Displayed", () => {
    cy.get('[data-cy="FreeShipping"]').should("be.visible");
    cy.log("✅✅ Free Shipping Box Displayed");
    cy.get('[data-cy="FreeReturn"]').should("be.visible");
    cy.log("✅✅ Free Return Box Displayed");
    cy.get('[data-cy="CountDaysAfterReciving"]').should("be.visible");
    cy.log("✅✅ Count Days After Reciving Box Displayed");
  });
});
// *************************************eleven*********************************************
describe("Should Verify Product Info Section", () => {
  it("Should Display The Old Price With A Strikethrough Effect", () => {
    cy.get(".product-old-price").should("exist");
    cy.log("✅✅ Product Old Price Exists");
    cy.get(".product-old-price svg").should("exist");
    cy.log("✅✅ Product Svg Price Exists");
  });
  it("Should Display The New Price", () => {
    cy.get(".product-new-price").should("exist");
    cy.log("✅✅ Product New Price Exists");
  });
  it("Should Display The Currency", () => {
    cy.get(".product-currency").should("exist").and("not.be.empty");
    cy.log("✅✅ Product Currency Exists & Not Empty");
  });
  it("Should Display TheInfo Icon", () => {
    cy.get(".info-icon svg").should("exist");
    cy.log("✅✅ Info Icon Exists");
  });
  it("Should Display Product Properties", () => {
    cy.get(".product-info-properties").should("exist");
    cy.log("✅✅ Product Info Properties Exists");
    cy.get(".product-prop-item").should("have.length.at.least", 4); // Adjust based on properties count
    cy.log("✅✅ Product Prop Item Exists");
  });
  it("should Verify Shipping & Return Icons", () => {
    cy.get('img[alt="truck"]').should("have.length", 2);
    cy.get('img[alt="deliveryman"]').should("exist");
    cy.log("✅✅ Shipping and return icons Exists");
  });
  it("Should Verify Shipping Date Text", () => {
    cy.contains("Ship To You Accepted").should("exist");
    cy.contains("2 June").should("exist");
    cy.log("✅✅ Shipping Date Text Exists");
  });
});
// *************************************twelve*********************************************
describe("Should Verify Product Datail Footer Section", () => {
  it("Should Check About Add To Cart Button", () => {
    cy.get('[data-cy="AddToCartButton-data-cy"]').should("be.visible");
    cy.log("✅✅ Add To Cart Button Exists");
  });
  it("Should Check About User InteraCtion BoX", () => {
    cy.get('[data-cy="InteraCtionBoX"]').should("be.visible");
    cy.log("✅✅ User InteraCtion BoX Exists");
  });
});
// *************************************twelve*********************************************
describe("Should Do Like And Dislike & Waiting The Request Related To Them", () => {
  let countLovesBeforePutLove = 0;
  let countLovesAfterPutLove = 0;
  let countLovesAfterPutLove1 = 0;
  it("should click LoveIcon only if not active", () => {
    cy.get("[data-cy=LoveClickOnLast]").then(($icon) => {
      if ($icon) {
        cy.clickElementForce("[data-cy=LoveSymbol]");
      } else {
        cy.log("Love Icon Not Clicked On Previsually");
      }
    });
  });
  it("Should Verify Love Icon & Get The Privsually Count Of Loves", () => {
    cy.get('[data-cy="LoveSymbol"]').should("be.visible");
    cy.log("✅✅ Love Symbol Button Exists");
    cy.get("[data-cy=CountOfLoves]")
      .invoke("text")
      .then((text) => {
        countLovesBeforePutLove = parseInt(text);
        cy.log(`count Loves Before Put Love Is: ${text}`);
      });
  });
  it("Should Verify Count Of Loves Increased", () => {
    cy.clickElementForce("[data-cy=LoveSymbol]");
    cy.log("✅✅ Love Symbol Button Clicked");
    cy.get("[data-cy=CountOfLoves]")
      .invoke("text")
      .then((text) => {
        countLovesAfterPutLove = parseInt(text);
        cy.log(`count Loves Before Put Love Is: ${text}`);
        expect(countLovesAfterPutLove).to.be.greaterThan(
          countLovesBeforePutLove
        );
      });
  });
  it("Should Waiting The Request Accured", () => {
    cy.intercept("POST", "**/api/new_v1/product_likes/store").as("Like");
    cy.get('[data-cy="LoveSymbol"]').should("be.visible");
    cy.log("✅✅ Love Symbol Button Exists");
    cy.get("@Like", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@Like", { timeout: 10000 }).then((interception) => {
          cy.log("✅✅ Like request arrived");
        });
      } else {
        cy.log("❌❌ Like request did not arrive");
      }
    });
  });
  it("Should Do DesLike", () => {
    cy.clickElementForce("[data-cy=LoveSymbol]");
    cy.log("✅✅ Love Symbol Button Clicked To Do Deslike");
    cy.get("[data-cy=CountOfLoves]")
      .invoke("text")
      .then((text) => {
        countLovesAfterPutLove1 = parseInt(text);
        cy.log(`count Loves Before Put Love Is: ${text}`);
        expect(countLovesAfterPutLove1).to.be.eq(countLovesAfterPutLove - 1);
      });
  });
  it("Should Waiting The Request Accured", () => {
    cy.intercept("POST", "**api/new_v1/product_likes/delete").as("DeleteLike");
    cy.get("@DeleteLike", { timeout: 10000 }).then((alias) => {
      if (alias) {
        cy.wait("@DeleteLike", { timeout: 10000 }).then((interception) => {
          cy.log("✅✅ DesLike request arrived");
        });
      } else {
        cy.log("❌❌ DesLike request did not arrive");
      }
    });
  });
});
// *************************************thirteen*********************************************
// describe("Should Type Comment In Comment Section", () => {
//   it("Should Click On Comment Icon", () => {
//     cy.logout();
//     cy.performLogin();
//     cy.get('[data-cy="CommentIcon"]').should("be.visible");
//     cy.log("✅✅ Comment Icon Button Exists");
//     cy.clickElementForce("[data-cy=CommentIcon]");
//     cy.log("✅✅ Comment Icon Clicked");
//   });
//   it("should render the comment section", () => {
//     cy.get('[data-cy="ExtendCoomentSection"]').should("be.visible");
//     cy.log("✅✅ Comment Icon Button Visible");
//     cy.get('[data-cy="ExtendCoomentSection"] .extended-bar-top span').should(
//       "contain.text",
//       "Comment About This Product"
//     );
//     cy.log("✅✅ Comment Extended Bar Visible");
//   });
// it("should load comments", () => {
//   cy.get('[data-cy="ExtendCoomentSection"]').within(() => {
//     cy.get(".comments-list").should("exist");
//   });
//   cy.log("✅✅ Comment List Visible");
// });
// it("should allow increasing comments", () => {
//   cy.intercept("POST", "/api/comments/increase", { statusCode: 200 }).as(
//     "increaseComments"
//   );

//   cy.get(
//     '[data-cy="ExtendCoomentSection"] button[data-cy="increase-comments"]'
//   ).click();
//   cy.wait("@increaseComments").its("response.statusCode").should("eq", 200);
// });
// it("should allow users to submit a new comment", () => {
//   cy.get('[data-cy="comment-input"]').type("This is a test comment");
//   cy.log("✅✅ Comment Input Visible % Write An Comment");
//   cy.get('[data-cy="submit-comment"]').click({ force: true });
//   cy.log("✅✅ Click On Comment Submit");
//   cy.get('[data-cy="comments-list"]').should(
//     "contain.text",
//     "This is a test comment"
//   );
//   cy.log("✅✅ Test Comment Added To List Comment");
// });
// it("should handle comment verification", () => {
//   cy.get('[data-cy="verify-comment"]').first().click({ force: true });
//   cy.get('[data-cy="comment-status"]')
//     .first()
//     .should("contain.text", "Verified");
//   cy.log("✅✅ Comment Add Operation Successfuly");
// });
// });
