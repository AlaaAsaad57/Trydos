let storedUserName1: string = "";
describe("Should Visit Website & Add Product To Cart", () => {
  before("Should Open The Trydos", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Select Any Boutique", () => {
    cy.ChooseBoutiqueAndVerifyComponentsAndBoxsInBoutiquePage();
  });
});
describe("Should Open One Of Pictures In Product Detail Page", () => {
  it("Should Open One Of Pictures In Product Detail Page", () => {
    cy.get(".embla__slide")
      .should("exist")
      .its("length")
      .then((count) => {
        cy.log(`There Are Stories About The Product & Count It Is: ${count}`);
        if (count > 1) {
          cy.clickElement(".embla__slide:eq(1)");
          cy.log("✅✅ Secondly Stories Chooses And Clicked");
          cy.clickElement("[data-cy=close_stories_icon]");
          cy.log("✅✅ Close Stories Icon Clicked");
        }
      });
  });
});
describe("Should Toggles Between Read More & Read Less Correctly", () => {
  it("Read More Button Test", () => {
    cy.get(".read-more").contains("Read More").should("be.visible");
    cy.log("✅✅ Read More Button Founded");
    cy.get(".read-more")
      .contains("Read More")
      .click({ force: true, scrollBehavior: false });
    cy.log("✅✅ Read More Button Clicked");
    cy.get(".read-more").contains("Read More").should("not.exist");
    cy.log("✅✅ Read More Button Disapperead");
  });
  it("Read Less Button Test", () => {
    cy.get(".read-more").contains("Read Less").should("be.visible");
    cy.log("✅✅ Read Less Button Founded");
    cy.get(".read-more")
      .contains("Read Less")
      .click({ force: true, scrollBehavior: false });
    cy.log("✅✅ Read Less Button Clicked");
    cy.get(".read-more").contains("Read Less").should("not.exist");
    cy.log("✅✅ Read Less Button Disapperead");
    cy.get(".read-more").contains("Read More").should("be.visible");
    cy.log("✅✅ Read More Button Reapperead");
  });
});
describe("Should Check Product Properties Section", () => {
  it("displays product properties correctly", () => {
    cy.get(".product-properties").should("be.visible");
    cy.log("✅✅ Product Properties Row Displayed");
    cy.get(".product-property-row").should("have.length", 3);
    cy.log("✅✅ Product Properties Row Displayed & Countains 3 Properties");
    cy.get(".product-property-row:eq(0)")
      .should("contain.text", "Good Quality Product")
      .find("svg")
      .should("exist");
    cy.get(".product-property-row:eq(1)")
      .should("contain.text", "Verified by trydos")
      .find("svg")
      .should("exist");
    cy.get(".product-property-row:eq(2)")
      .should("contain.text", "Made In")
      .find("svg")
      .should("exist");
    cy.log("✅✅ All Properties Displayed & ");
  });
});
describe("Should Verify All Label Founded", () => {
  it("Should Check All Labels Founded & Logs This Text", () => {
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
});
describe("Should Verify Available Colors Of The Product", () => {
  let CountOfColor = 0;
  it("Should Get The Number Of  Available Color", () => {
    cy.get("[data-cy=Color-Length]")
      .invoke("text")
      .then((ColorLength) => {
        const match = ColorLength.match(/(\d+)/);
        const CountOfColor = match ? parseInt(match[0]) : 0;
        cy.log(`The Count Of Size Circle Is: ${CountOfColor}`);
      });
  });
  it("Should Check Swipper Photo & Click On An Photo", () => {
    if (CountOfColor > 0) {
      // Should Add Code To Check If CountOfColor === Count Of SwiperPhoto When linking to the database
      cy.get('[data-cy="SwiperPhoto"]').should("be.visible");
      cy.log("✅✅ Swiper Photo Displayed");
      cy.clickElement("[data-cy=SwiperPhoto]:eq(0)");
      cy.log("✅✅ First Swiper Photo Clicked");
      cy.get('[data-cy="AfterClickOnSwipperPhoto"]').should("be.visible");
      cy.log("✅✅ Container Of Swiper Photo Displayed");
    } else {
      cy.log("❌❌ Count Of Available Color Is: 0");
    }
  });
});
describe("Should Click On Each QuestionMark Component & Read InfoWindow Text", () => {
  it("Should Verify & Click On QuestionMark Component and Read InfoWindow Text", () => {
    cy.get("[data-cy=QuestionMark]").each(($el, index) => {
      cy.wrap($el)
        .click({ force: true, scrollBehavior: false })
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
describe("Should Open Camera Shot Picture", () => {
  it("Should Verify Swipper Photo1", () => {
    // Should Add Code To Check If Count Of Shots === Count Of SwiperPhoto1 When linking to the database
    cy.get('[data-cy="CameraIcon"]').should("be.visible");
    cy.log("✅✅ Camera Icon Displayed");
    cy.get('[data-cy="SwiperPhoto1"]').should("be.visible");
    cy.log("✅✅ Swiper Photo1 Displayed");
    cy.clickElement("[data-cy=SwiperPhoto1]:eq(0)");
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
    cy.clickElement("[data-cy=GalleryChooseItem]:eq(0)");
    cy.log("✅✅ Firstly Gallery Choose Item Clicked");
  });
  it("Should Check Whether User Interaction Box & Get Number Of Love Interactions", () => {
    cy.get('[data-cy="UserInteractions"]').should("be.visible");
    cy.log("✅✅ User Interactions Displayed");
    cy.get('[data-cy="CountOfUserInteractions"]:eq(0)').scrollIntoView();
    cy.log("✅✅ Box Interactions Displayed");
    cy.get("[data-cy=CountOfLoved]:eq(0)")
      .invoke("text")
      .then((count) => {
        cy.log(`✅✅ User Loves Interactions Is: ${count}`);
      });
    cy.log("✅✅ Count Of User Interactions Displayed");
  });
  it("Should Check Whether Info Box & Close Image Interface", () => {
    cy.get("[data-cy=ProductsDetailInfo]:eq(0)").scrollIntoView();
    cy.log("✅✅ Products Detail & Info Displayed");
    cy.clickElement("[data-cy=ToClose]:eq(0)");
    cy.log("✅✅ Icon For Close Clicked");
    cy.get("body").click(0, 0);
  });
});
describe("Should Open last Story", () => {
  it("Should Click On Last Story & Close it", () => {
    cy.get('[data-cy="StoriesIcon"]').should("be.visible");
    cy.log("✅✅ Stories Icon Displayed");
    cy.get("[data-cy=Story]")
      .last()
      .click({ force: true, scrollBehavior: false });
    cy.log("✅✅ The Last Story Opened");
    cy.ChexkExistElement(".fixed-layout").then((s) => {
      if (s) {
        // @ts-ignore
        cy.get(".fixed-layout").realSwipe("toBottom", {
          length: 500,
        });
      }
    });
    cy.ChexkExistElement(".fixed-layout").then((s) => {
      if (!s) {
        cy.log("Stories Closed Successfully");
      }
    });
  });
});
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
    if (SizeCount1 > 0) {
      cy.get('[data-cy="SizeBoxProductDetail"]').should("be.visible");
      cy.log("✅✅ Size Box Displayed");
      // Should Add Code To Check If Count Of SizeCount1 === Count Of ElementOnSizeBox When linking to the database
      cy.clickElement("[data-cy=ElementOnSizeBox]:eq(0)");
      cy.log("✅✅ Element On Size Box Clicked");
      cy.get('[data-cy="SizeSliderBox"]').should("be.visible");
      cy.log("✅✅ Size Slider Box Displayed");
      cy.get('[data-cy="SizeCircle"]').should("be.visible");
      cy.log("✅✅ Size Circle Displayed");
      cy.get("[data-cy=SizeCircle]")
        .its("length")
        .then((count) => {
          cy.log(`The Count Of Size Circle Is: ${count}`);
          expect(SizeCount1).to.be.eq(count);
          cy.log("✅✅ Count Of Size Circle Matched Available Sizes");
          cy.log("❌❌ Count Of Size Circle Not Matched Available Sizes");
        });
    }
  });
  it("Should Check Whether About Boxes Below Size Circle", () => {
    if (SizeCount1 > 0) {
      cy.get('[data-cy="RecommendedHelp"]').should("be.visible");
      cy.log("✅✅ Recommended Help Box Displayed");
      cy.get('[data-cy="SizeInfoBoxAboutRecommend"]').should("be.visible");
      cy.log("✅✅ Size Info Box About Recommend Box Displayed");
      cy.get('[data-cy="ProductShiping"]').should("be.visible");
      cy.log("✅✅  Product Shiping Displayed");
    }
  });
});
describe("Should Verify Product Shipping & Delivery", () => {
  it("Should Verify About Product Shipping & Delivery Displayed", () => {
    cy.clickElement('[data-cy="ProductShiping"]');
    cy.log("✅✅ Product Shiping Box Clicked");
  });
  it("Should Verify About Boxes Apperead Below Product Shipping & Delivery", () => {
    cy.get('[data-cy="AddresInfo"]').should("be.visible");
    cy.get('[data-cy="AddresInfo1"]').should("be.visible");
    cy.get('[data-cy="AddresInfo2"]').should("be.visible");
    cy.get('[data-cy="GreenLabel"]').should("be.visible");
    cy.log("✅✅ All Addres Info Boxes Displayed");
    cy.clickElement('[data-cy="ProductShiping"]');
  });
});
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
describe("Should Do Like And Dislike & Waiting The Request Related To Them", () => {
  let countLovesBeforePutLove = 0;
  let countLovesAfterPutLove = 0;
  let countLovesAfterPutLove1 = 0;
  it("should logout", () => {
    cy.Exist("[data-cy=Logout-ReLogout]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=Logout-ReLogout]").click({ force: true });
        cy.intercept(
          "GET",
          "**/api/new_v1/web/product/likesCommentsSharesDetails/**"
        ).as("loadProductDetail");
        cy.get("[data-cy=logout]").click({
          force: true,
          scrollBehavior: false,
        });
        cy.log("✅✅ You have successfully logged out");
        cy.wait("@loadProductDetail", { timeout: 30000 }).then((inter) => {
          cy.log("✅✅ Load Product Detail Request Arrived");
        });
      } else {
        cy.log("❌❌ No Login Founded!");
      }
    });
  });
  it("should click LoveIcon only if not active", () => {
    cy.ChexkExistElement("[data-cy=LoveClickOnLast]").then(($icon) => {
      if ($icon) {
        cy.intercept(
          "POST",
          "**/market-under-dev-backend.trydos.dev/api/new_v1/product_likes/delete"
        ).as("DeleteLike");
        cy.clickElement("[data-cy=LoveSymbol]");
        cy.wait("@DeleteLike").then((interception) => {
          cy.log("✅✅ DesLike request arrived");
        });
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
        countLovesBeforePutLove = parseInt(text) || 0;
        cy.log(`count Loves Before Put Love Is: ${countLovesBeforePutLove}`);
      });
  });
  it("Should Verify Count Of Loves Increased", () => {
    cy.intercept(
      "POST",
      "**/market-under-dev-backend.trydos.dev/api/new_v1/product_likes/store"
    ).as("Like");
    cy.clickElement("[data-cy=LoveSymbol]");
    cy.log("✅✅ Love Symbol Button Clicked");
    cy.wait("@Like").then((interception) => {
      cy.log("✅✅ Like request arrived");
    });
    cy.get("[data-cy=CountOfLoves]")
      .invoke("text")
      .then((text) => {
        countLovesAfterPutLove = parseInt(text) || 0;
        cy.log(`count Loves Before Put Love Is: ${countLovesAfterPutLove}`);
        expect(countLovesAfterPutLove).to.be.greaterThan(
          countLovesBeforePutLove
        );
      });
  });
  it("Should Do DesLike", () => {
    cy.intercept(
      "POST",
      "**/market-under-dev-backend.trydos.dev/api/new_v1/product_likes/delete"
    ).as("DeleteLike");
    cy.clickElement("[data-cy=LoveSymbol]");
    cy.log("✅✅ Love Symbol Button Clicked To Do Deslike");
    cy.wait("@DeleteLike").then((interception) => {
      cy.log("✅✅ DesLike request arrived");
    });
    cy.get("[data-cy=CountOfLoves]")
      .invoke("text")
      .then((text) => {
        countLovesAfterPutLove1 = parseInt(text) || 0;
        cy.log(`count Loves Before Put Love Is: ${countLovesAfterPutLove1}`);
        expect(countLovesAfterPutLove1).to.be.eq(countLovesAfterPutLove - 1);
      });
  });
});
describe("Should Type Comment In Comment Section", () => {
  let CountOfCommentPrevisually: number = 0;
  let CountOfCommentAfterComment: number = 0;
  let count1: number = 0;
  let AddedOk: number = 0;
  it("Should Click On Comment Icon", () => {
    cy.get('[data-cy="CommentIcon"]')
      .should("be.visible")
      .click({ force: true, scrollBehavior: false });
    cy.log("✅✅ Comment Icon Button Exists and Clicked");
  });
  it("should render the comment section", () => {
    cy.get('[data-cy="ExtendCoomentSection"]').should("be.visible");
    cy.log("✅✅ Comment Section Visible");
    cy.get('[data-cy="ExtendCoomentSection"] .extended-bar-top span').should(
      "contain.text",
      "Comment About This Product"
    );
    cy.log("✅✅ Comment Extended Bar Visible");
    cy.get('[data-cy="ExtendCoomentSection"] .extended-bar-top svg').should(
      "be.visible"
    );
  });
  it("should Get Count Of Comments Founded Previsually", () => {
    cy.ChexkExistElement("[data-cy=CountOfComment]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=CountOfComment]").should("be.visible");
        cy.get("[data-cy=CountOfComment]")
          .invoke("text")
          .then((text) => {
            CountOfCommentPrevisually = parseInt(text) || 0;
            cy.log(`The Couunt Of Comments Is: ${CountOfCommentPrevisually}`);
          });
      } else {
        cy.log("❌❌ No Comment Just Now");
      }
    });
  });
  it("should Check Comments", () => {
    cy.ChexkExistElement(".comment-item").then((exist) => {
      if (exist) {
        cy.get(".comment-item").should("be.visible");
        cy.get(".comment-item")
          .its("length")
          .then((count) => {
            cy.log(`✅✅ The Couunt Of Comments Is: ${count}`);
            count1 = count;
            expect(CountOfCommentPrevisually).to.be.eq(count1);
          });
      } else {
        cy.log("❌❌ No Comment Just Now");
      }
    });
  });
  it("should allow users to submit a new comment", () => {
    cy.intercept(
      "POST",
      "**/market-under-dev-backend.trydos.dev/api/new_v1/customer/product_comment"
    ).as("Comment");
    cy.get('[data-cy="CommentField"]').type("This is a test comment", {
      force: true,
      scrollBehavior: false,
    });
    cy.log("✅✅ Comment Input Visible % Write A Comment");
    cy.clickElement('[data-cy="SubmitComment"]');
    cy.log("✅✅ Click On Comment Submit");
    cy.wait("@Comment").then((interception) => {
      cy.log("✅✅ Comment request arrived");
    });
    cy.get(".comment-text")
      .eq(0)
      .should("contain.text", "This is a test comment");
    cy.log("✅✅ Test Comment Added To List Comment");
    AddedOk++;
    cy.log(`AddedOk value: ${AddedOk}`);
  });
  it("should Get Count Of Comments After Add Comment", () => {
    cy.ChexkExistElement("[data-cy=CountOfComment]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=CountOfComment]")
          .invoke("text")
          .then((text) => {
            CountOfCommentAfterComment = parseInt(text) || 0;
            cy.log(
              `There Couunt Of Comments Is: ${CountOfCommentAfterComment}`
            );
            expect(CountOfCommentAfterComment).to.be.eq(count1 + 1);
          });
      }
    });
  });
  it("should Verify The Comment Added As A Guest Source", () => {
    if (AddedOk > 0) {
      cy.get("[data-cy=Source-Of-Comment]")
        .should("be.visible")
        .invoke("text")
        .then((data) => {
          const trimmedData = data.trim();
          if (trimmedData === "guest") {
            cy.log("✅✅ Comment Added As A Guest Source");
          } else {
            cy.log("❌❌ Comment Not Added As A Guest Source");
          }
        });
    } else {
      cy.log("❌❌ Operation To Add Comment Not Completly");
    }
  });
  it("should Verify The Comment Date Added With Comment Text", () => {
    const currentTime = new Date();
    const formattedCurrentTime = currentTime.toLocaleTimeString("en-SA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    cy.log(`Expected Time: ${currentTime}`);
    cy.get("[data-cy=Date-Of-Comment]:eq(0)", { timeout: 20000 })
      .should("be.visible")
      .invoke("text")
      .then((displayedTime) => {
        cy.log(`Displayed Time: ${displayedTime}`);

        const displayedDate = new Date();
        const [displayedHour, displayedMinute] = displayedTime
          .trim()
          .split(":")
          .map(Number);
        displayedDate.setHours(displayedHour, displayedMinute, 0);

        const timeDifference =
          Math.abs(currentTime.getTime() - displayedDate.getTime()) / 60000; // Difference in minutes
        expect(timeDifference).to.be.within(0, 2); // Allowing up to 2 minutes difference
      });
  });
  it("should Click On Comment Icon To Close Comment Area", () => {
    cy.clickElement('[data-cy="CommentIcon"]');
    cy.log("✅✅ Comment Icon Clicked To Close Comment Area");
  });
});
describe("Should Type Share In Share Section", () => {
  let CountOfSharesPrevisually: number = 0;
  let count1: number = 0;
  let CountOfSharesLastly: number = 0;
  let CountOfSharesLastly1: number = 0;
  let CountOfSharesLastly2: number = 0;
  it("Should Click On Share Icon", () => {
    cy.get('[data-cy="ShareIcon"]')
      .should("be.visible")
      .click({ force: true, scrollBehavior: false });
    cy.log("✅✅ Comment Icon Button Exists and Clicked");
  });
  it("should Get Count Of Shares Founded Previsually", () => {
    cy.get("[data-cy=CountOfShares]").should("be.visible");
    cy.get("[data-cy=CountOfShares]")
      .invoke("text")
      .then((text) => {
        CountOfSharesPrevisually = parseInt(text) || 0;
        cy.log(`There Couunt Of Comments Is: ${CountOfSharesPrevisually}`);
      });
  });
  it("should contain a share icon", () => {
    cy.get('[data-cy="ExtendShareSection"] svg').should("exist");
  });
  it("should display the share text", () => {
    cy.get('[data-cy="ExtendShareSection"]').contains(
      "Share This Product With"
    );
  });
  it("should contain the share options section", () => {
    cy.get('[data-cy="ExtendShareSection"] .content-extended').should("exist");
  });
  it("should contain the share options section", () => {
    cy.get('[data-cy="Facebook"]').should("exist");
    cy.get('[data-cy="Facebook"] .share-name').contains("Facebook");
  });
  it("should contain the share options section", () => {
    cy.get('[data-cy="Twitter"]').should("exist");
    cy.get('[data-cy="Twitter"] .share-name').contains("Twitter / X");
  });
  it("should contain the share options section", () => {
    cy.get('[data-cy="Whatsapp"]').should("exist");
    cy.get('[data-cy="Whatsapp"] .share-name').contains("WhatsApp");
  });
  it("should open WhatsApp share link", () => {
    cy.window().then((win) => {
      cy.stub(win, "open").as("windowOpen");
    });
    cy.get('[data-cy="Whatsapp"]').click();
    cy.get("@windowOpen").should(
      "be.calledWithMatch",
      /web.whatsapp.com\/send\?text=/
    );
  });
  it("should Waiting Request", () => {
    cy.intercept(
      "POST",
      "**/chating-staging-trydos.trydos.dev/api/v2/elastic/share_product_on_apps"
    ).as("whatsappShare");
    cy.wait("@whatsappShare", { timeout: 10000 })
      .its("response.statusCode")
      .should("eq", 200);
  });
  it("should Get Count Of Shares After Share", () => {
    cy.get("[data-cy=CountOfShares]").should("be.visible");
    cy.get("[data-cy=CountOfShares]")
      .invoke("text")
      .then((text) => {
        CountOfSharesLastly = parseInt(text) || 0;
        cy.log(`There Couunt Of Comments Is: ${CountOfSharesLastly}`);
        cy.wait(5000).then(() => {
          expect(CountOfSharesLastly).to.be.eq(CountOfSharesPrevisually + 1);
        });
      });
  });
  it("should open Twitter share link", () => {
    cy.window().then((win) => {
      cy.stub(win, "open").as("windowOpen");
    });
    cy.get('[data-cy="Twitter"]').click();
    cy.get("@windowOpen").should(
      "be.calledWithMatch",
      /twitter\.com\/intent\/tweet\?url=/
    );
  });
  it("should Waiting Request", () => {
    cy.intercept(
      "POST",
      "**/chating-staging-trydos.trydos.dev/api/v2/elastic/share_product_on_apps"
    ).as("TwitterShare");
    cy.wait("@TwitterShare", { timeout: 10000 })
      .its("response.statusCode")
      .should("eq", 200);
  });
  it("should Get Count Of Shares After Share", () => {
    cy.get("[data-cy=CountOfShares]").should("be.visible");
    cy.get("[data-cy=CountOfShares]")
      .invoke("text")
      .then((text) => {
        CountOfSharesLastly1 = parseInt(text) || 0;
        cy.log(`There Couunt Of Comments Is: ${CountOfSharesLastly1}`);
        expect(CountOfSharesLastly1).to.be.eq(CountOfSharesLastly + 1);
      });
  });
  it("should open Facebook share link", () => {
    cy.window().then((win) => {
      cy.stub(win, "open").as("windowOpen");
    });
    cy.get('[data-cy="Facebook"]').click();
    cy.get("@windowOpen").should(
      "be.calledWithMatch",
      /facebook\.com\/sharer\/sharer\.php\?u=/
    );
  });
  it("should Waiting Request", () => {
    cy.intercept(
      "POST",
      "**/chating-staging-trydos.trydos.dev/api/v2/elastic/share_product_on_apps"
    ).as("FacebookShare");
    cy.wait("@FacebookShare", { timeout: 10000 })
      .its("response.statusCode")
      .should("eq", 200);
  });
  it("should Get Count Of Shares After Share", () => {
    cy.get("[data-cy=CountOfShares]").should("be.visible");
    cy.get("[data-cy=CountOfShares]")
      .invoke("text")
      .then((text) => {
        CountOfSharesLastly2 = parseInt(text) || 0;
        cy.log(`There Couunt Of Comments Is: ${CountOfSharesLastly2}`);
        expect(CountOfSharesLastly2).to.be.eq(CountOfSharesLastly1 + 1);
      });
    cy.clickElement('[data-cy="ShareIcon"]');
  });
});
describe("Should Do Login & Add Comment & Extract User Name", () => {
  it("Should Do Login", () => {
    cy.performLogin();
  });
  it("should extract user name, store it, and log it", () => {
    cy.get('[data-cy="NavUserName"]')
      .invoke("text")
      .then((userName: string) => {
        const trimmedUserName = userName.trim();
        cy.log("Extracted User Name:", trimmedUserName);
        expect(trimmedUserName).not.to.be.empty;
        storedUserName1 = trimmedUserName;
        cy.log("Stored User Name:", storedUserName1);
      });
  });
});
describe("Should Type Comment In Comment Section After Login & Verify The Comment Add As User Name", () => {
  let CountOfCommentPrevisuallyAfterLogin: number = 0;
  let CountOfCommentAfterLoginAndComment: number = 0;
  let AddedOk: number = 0;
  it("Should Click On Comment Icon", () => {
    cy.get('[data-cy="CommentIcon"]')
      .should("be.visible")
      .click({ force: true, scrollBehavior: false });
    cy.log("✅✅ Comment Icon Button Exists and Clicked");
  });
  it("should Get Count Of Comments Founded Previsually", () => {
    cy.get("[data-cy=CountOfComment]").should("be.visible");
    cy.get("[data-cy=CountOfComment]")
      .invoke("text")
      .then((text) => {
        CountOfCommentPrevisuallyAfterLogin = parseInt(text) || 0;
        cy.log(
          `There Couunt Of Comments Is: ${CountOfCommentPrevisuallyAfterLogin}`
        );
      });
  });
  it("should render the comment section", () => {
    cy.get('[data-cy="ExtendCoomentSection"]').should("be.visible");
    cy.log("✅✅ Comment Section Visible");
    cy.get('[data-cy="ExtendCoomentSection"] .extended-bar-top span').should(
      "contain.text",
      "Comment About This Product"
    );
    cy.log("✅✅ Comment Extended Bar Visible");
    cy.get('[data-cy="ExtendCoomentSection"] .extended-bar-top svg').should(
      "be.visible"
    );
  });
  it("should allow users to submit a new comment", () => {
    cy.intercept(
      "POST",
      "**/market-under-dev-backend.trydos.dev/api/new_v1/customer/product_comment"
    ).as("Comment");
    cy.get('[data-cy="CommentField"]').type(
      "This is a test comment after login",
      {
        force: true,
        scrollBehavior: false,
      }
    );
    cy.log("✅✅ Comment Input Visible % Write A Comment");
    cy.clickElement('[data-cy="SubmitComment"]');
    cy.log("✅✅ Click On Comment Submit");
    cy.wait("@Comment").then((interception) => {
      cy.log("✅✅ Comment request arrived");
    });
    cy.get(".comment-text:eq(0)").should(
      "contain.text",
      "This is a test comment after login"
    );
    cy.log("✅✅ Test Comment Added To List Comment");
    AddedOk++;
    cy.log(`AddedOk value: ${AddedOk}`);
  });
  it("should Get Count Of Comments After Add Comment", () => {
    cy.get("[data-cy=CountOfComment]")
      .invoke("text")
      .then((text) => {
        CountOfCommentAfterLoginAndComment = parseInt(text) || 0;
        cy.log(
          `There Couunt Of Comments Is: ${CountOfCommentAfterLoginAndComment}`
        );
        expect(CountOfCommentAfterLoginAndComment).to.be.eq(
          CountOfCommentPrevisuallyAfterLogin + 1
        );
      });
  });
  it("should Verify The Comment Added As A Guest Source", () => {
    if (AddedOk > 0) {
      cy.get("[data-cy=Source-Of-Comment]:eq(0)")
        .should("be.visible")
        .invoke("text")
        .then((data) => {
          const trimmedData = data.trim();
          expect(trimmedData).to.be.eq(storedUserName1);
        });
    } else {
      cy.log("❌❌ Operation To Add Comment Not Completly");
    }
  });
  it("should Verify The Comment Date Added With Comment Text", () => {
    const currentTime = new Date();
    const formattedCurrentTime = currentTime.toLocaleTimeString("en-SA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    cy.log(`Expected Time: ${formattedCurrentTime}`);
    cy.get("[data-cy=Date-Of-Comment]", { timeout: 20000 })
      .eq(0)
      .should("be.visible")
      .invoke("text")
      .then((displayedTime) => {
        cy.log(`Displayed Time: ${displayedTime}`);
        const displayedDate = new Date();
        const [displayedHour, displayedMinute] = displayedTime
          .trim()
          .split(":")
          .map(Number);
        displayedDate.setHours(displayedHour, displayedMinute, 0);
        const timeDifference =
          Math.abs(currentTime.getTime() - displayedDate.getTime()) / 60000; // Difference in minutes
        expect(timeDifference).to.be.within(0, 2); // Allowing up to 2 minutes difference
      });
  });

  it("should Click On Comment Icon To Close Comment Area", () => {
    cy.clickElement('[data-cy="CommentIcon"]');
    cy.log("✅✅ Comment Icon Clicked To Close Comment Area");
  });
});
