"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MotionConfig } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "store";
import auth from "services/auth";
import { showErrorNotification } from "store/notifications/reducer";
import ActiveColorDetailsSlider from "components/products/ActiveColorDetailsSlider";
import ExtendedAreaInfo from "components/products/ExtendedAreaInfo";
import { useIsModalRoute } from "components/ModalRoute/ModalRouteContext";
import { slidePage } from "components/ModalRoute/pageSlide";
import { useCommentLike } from "components/Server/product/useCommentLike";
import { fetchBuyersComments } from "components/Server/product/ProductBuyersComment/ProductBuyersCommentList";
import { fetchFaqComments } from "components/Server/product/ProductFAQSection/FaqQuestionsList";
import { useAskQuestion } from "components/Server/product/ProductFAQSection/useAskQuestion";
import { useProductLike } from "components/Server/product/ProductFooter.tsx/useProductLike";
import { OverlayForClose } from "components/Server/product/ProductFooter.tsx/OverlayForCLose";
import { useLiveColor, useLiveParam } from "hooks/useLiveColor";
import { formatCount } from "utils/formatCount";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { translateFunction } from "utils/functions";
import { isValidPhone } from "utils/phone";
import {
  DisableScroll,
  EnableScroll,
  FlagIcon,
  formatTime,
  getVideoUrl,
  whenUserIdReady,
} from "utils/tinyUtils";
import type { DemoDictionary, DemoKey } from "../../DemoApp/demoKeys";
import Toast, { useToast } from "../chat/Toast";
import { PAGE_MAX } from "../demo1Layout";
import { sentenceStyle, titleStyle } from "../demoCase";
import { toQuestionCard, toReviewCard, type CardWords } from "../productCards";
import type { ProductView, QuestionCardData } from "../productData";
import { usePageDir } from "../rtl";
import { useCardPages } from "../useCardPages";
import { LikesView, ProductPage, Rich, type CardLikesProps } from "./ProductPage";

/** The event fields of the product, as the old page sent them. */
type ProductGA = Record<string, unknown>;

/**
 * True for a shopper with a real phone number. A guest also has a user id, but
 * no comments token, so a like or a question from a guest ends in a 401: ask
 * for the sign-in first. The same rule as `useProfileData`.
 */
function signedInOrAsk() {
  if (isValidPhone(auth.User()?.phone)) return true;
  useAppStore.getState().setLoginOpen(true);
  showErrorNotification(translateFunction("Please Login First"));
  return false;
}

/** The heart of a real card: the live like of the comments backend. */
function RealLikes({ top, like, t }: CardLikesProps) {
  const language = useAppStore((s) => s.language) ?? "en";
  const [burst, setBurst] = useState(0);
  const live = useCommentLike({
    comment_id: like.commentId,
    target_type: like.targetType,
    productId: like.productId,
    is_liked: like.liked,
    total_likes: like.likes,
    language,
  });
  return (
    <LikesView
      top={top}
      liked={live.isLiked}
      burst={burst}
      count={live.likes > 0 ? formatCount(live.likes, language) : null}
      onToggle={() => {
        if (!signedInOrAsk()) return;
        if (!live.isLiked) setBurst((n) => n + 1);
        live.react();
      }}
      t={t}
    />
  );
}

/** The product's videos, full size, over the page. A swipe goes to the next one. */
function VideoOverlay({
  videos,
  onClose,
  label,
}: {
  videos: readonly string[];
  onClose: () => void;
  label: string;
}) {
  useEffect(() => {
    DisableScroll();
    return () => EnableScroll();
  }, []);
  return createPortal(
    <div
      data-pw="product-video-overlay"
      role="dialog"
      aria-label={label}
      onClick={onClose}
      className="fixed inset-0 flex items-center bg-black/80 z-99999999999999"
    >
      <div
        className="flex w-full overflow-x-auto [scroll-snap-type:x_mandatory] [scrollbar-width:none]"
        style={{ height: "65vh" }}
      >
        {videos.map((video, i) => (
          <div key={video} className="flex items-center justify-center shrink-0 w-full h-full [scroll-snap-align:center]">
            <video
              src={getVideoUrl(video, { width: 700, height: 900 })}
              autoPlay={i === 0}
              controls
              loop
              playsInline
              onClick={(e) => e.stopPropagation()}
              className="max-w-full h-full object-contain rounded-[15px]"
            />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}

/**
 * The real product page (Stage 7c, A-31, A-33): the design (`ProductPage`,
 * XD `Home Page – 49`) with the live product.
 *
 *  - the colour lives in the address (`?color=`), as before. A tap writes it
 *    with no read from the server: every colour's photos are on the page;
 *  - the heart is the live like (S7c-2); the more mark opens the old sheet,
 *    which holds the wishlist, the alerts and compare;
 *  - both bells say "Soon available" (S7c-3);
 *  - a tap on a photo opens the old zoom overlay. That part also sends
 *    `view_item` and `view_time_product`;
 *  - the blue button is the ask field (S7c-7);
 *  - the review and question rows read their next page near their end
 *    (S7c-10).
 *
 * The old footer does not show until D-45 (S7c-1), so this page has no price
 * and no "add to cart". English is in Apple's capital rules (D-4); other
 * languages use the server's dictionary.
 */
export default function AppProduct({
  lang,
  view,
  reviewsOffset,
  questionsOffset,
  info,
  origin,
  days,
  dictionary,
  videos,
  analytics,
  light,
  imagesByColor,
  social,
  serverColor,
  serverSize,
  ownerId,
  ownerType,
}: {
  lang: string;
  view: ProductView;
  /** Where the server's first pages ended. */
  reviewsOffset: unknown;
  questionsOffset: unknown;
  info: { label: string; values: string[] }[];
  origin: { iso: string; text: string } | null;
  /** The values of the delivery lines. */
  days: { day: string; date: string; days: number; country: string };
  dictionary: DemoDictionary;
  videos: readonly string[];
  analytics: ProductGA;
  /** The old "more" sheet's product. */
  light: Record<string, any>;
  /** The zoom overlay's photos, in the same order as the gallery's. */
  imagesByColor: { keys: string[]; images: any[] }[];
  social: { likes: number; liked: boolean };
  serverColor?: string;
  serverSize?: string;
  ownerId: unknown;
  ownerType: unknown;
}) {
  const router = useRouter();
  const pageDir = usePageDir();
  const isModal = useIsModalRoute();
  const [, language] = lang.split("-");
  const english = language === "en";
  const t = (key: DemoKey) =>
    english ? titleStyle(key) : (dictionary[key] ?? key);
  const body = (key: DemoKey) =>
    english ? sentenceStyle(key) : (dictionary[key] ?? key);
  const [toast, showToast] = useToast();

  // The colour on show follows the address, also on the browser's back button.
  const liveColor = useLiveColor(serverColor);
  const liveSize = useLiveParam("size", serverSize);
  const found = view.colors.findIndex((c) => c.keys.includes(liveColor ?? ""));
  const picked = found < 0 ? 0 : found;

  const onPick = (index: number) => {
    const color = view.colors[index];
    if (!color || index === picked) return;
    GAevent({
      action: GA_EVENT_NAMES.CHANGE_COLOR,
      params: {
        user_id_custom: auth.UserID(),
        item_id: analytics.item_id,
        item_name: analytics.item_name,
        brand: analytics.brand,
        brand_id: analytics.brand_id,
        category: analytics.category,
        category_id: analytics.category_id,
        price: analytics.price,
        selected_color: color.key,
        selected_size: liveSize,
      },
    });
    const address = new URL(window.location.href);
    address.searchParams.set("color", color.key ?? "");
    // Next keeps `useSearchParams` in step with this call, so the page changes
    // with no read from the server.
    window.history.replaceState(null, "", address);
  };

  // `view_image` and the screen's view, as the old photo slider sent them: once
  // for each colour on show.
  useEffect(() => {
    const { interaction_type, likes_count, boutique_id, ...product } = analytics;
    return whenUserIdReady(
      (userId: unknown) => {
        const store = useAppStore.getState();
        GAevent({
          action: GA_EVENT_NAMES.VIEW_IMAGE,
          params: {
            user_id_custom:
              userId ?? auth.UserID() ?? store.userProfile?.id ?? store.user?.id,
            ...product,
          },
        });
        GAevent({
          action: GA_EVENT_NAMES.SCREEN_VIEW,
          params: {
            screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
            screen_path: window.location.pathname,
          },
        });
      },
      () => auth.UserID(),
    );
  }, [analytics.item_id, picked]);

  const onBack = () => {
    if (isModal) {
      router.back();
      return;
    }
    const store = useAppStore.getState();
    const last = store.lastPathname;
    const listing = ["boutiques", "filters", "featured", "flashdeals"].some(
      (word) => last?.includes(word),
    );
    const href = last || `/${lang}`;
    slidePage(href, () => {
      store.setIsNavigating(listing ? { is_boutique: true } : { is_full_home: true });
      router.push(href);
    });
  };

  const [burst, setBurst] = useState(0);
  const like = useProductLike({
    total_likes: social.likes,
    isLiked: social.liked,
    productId: view.id,
    name: light.name,
    category: light.category?.name,
    brand: light.brand?.name,
    price: light.offer_price,
    brand_id: light.brand?.id,
    category_id: light.category?.id,
  });

  const cardWords: CardWords = {
    date: formatTime,
    goodQuality: t("Good Quality"),
    trueSize: t("True Size"),
    dear: t("Dear"),
  };
  const reviews = useCardPages({
    first: view.reviews,
    offset: reviewsOffset,
    read: (offset) =>
      fetchBuyersComments({ productId: view.id, offset, language }),
    toCard: (comment) => toReviewCard(comment, cardWords),
    scenario: "Error In reading more reviews in AppProduct",
  });
  const questions = useCardPages({
    first: view.questions,
    offset: questionsOffset,
    read: (offset) => fetchFaqComments({ productId: view.id, offset, language }),
    toCard: (comment) => toQuestionCard(comment, cardWords),
    scenario: "Error In reading more questions in AppProduct",
  });

  // The questions this shopper asked now. Search shows them seconds later, so
  // they are kept here as the old list kept them.
  const [asked, setAsked] = useState<QuestionCardData[]>([]);
  const question = useAskQuestion({
    language,
    color: liveColor,
    size: liveSize,
    owner_id: ownerId,
    owner_type: ownerType,
    productId: view.id,
    onAdded: (comment) =>
      setAsked((list) => [toQuestionCard(comment, cardWords), ...list]),
  });

  const [more, setMore] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  // The sheet and the video hang on <body>, which the server does not draw.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const video = videos[0] ? (
    <video
      src={getVideoUrl(videos[0], { width: 700, height: 900, end: 10 })}
      autoPlay
      loop
      muted
      playsInline
      className="block w-full h-full object-cover"
    />
  ) : undefined;

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-pw="app-product"
        dir={pageDir}
        className="relative w-full mx-auto font-quicksand"
        style={{ maxWidth: PAGE_MAX, overflowX: "clip" }}
      >
        <ProductPage
          t={t}
          body={body}
          view={{
            ...view,
            reviews: reviews.cards,
            questions: [
              ...asked,
              ...questions.cards.filter(
                (card) => !asked.some((mine) => mine.id === card.id),
              ),
            ],
          }}
          reviewsMore={reviews.more}
          questionsMore={questions.more}
          picked={picked}
          onPick={onPick}
          onBack={onBack}
          onBell={() => showToast(t("Soon available"))}
          onMore={() => setMore(true)}
          heart={{
            liked: like.liked,
            burst,
            toggle: () => {
              if (!signedInOrAsk()) return;
              if (!like.liked) setBurst((n) => n + 1);
              like.toggle();
            },
          }}
          lines={{
            delivery: {
              text: t("{day} <m>{date} </m>| <m>{days}</m> work days in your hands in <m>{country}</m>"),
              values: days,
            },
            inHands: {
              text: t("<m>just {days} days</m> In your hands"),
              values: { days: days.days },
            },
            arrives: {
              text: t("<b>{date}</b> in {country}"),
              values: { date: days.date, country: days.country },
            },
            returnText: {
              text: body(
                "Within <m>{days} days</m> after receiving the product, you can return it without conditions or reasons with complete ease and \n<a>get the amount back </a>to your wallet",
              ),
              values: { days: view.returnDays },
            },
          }}
          info={info.map((row, i) => (
            <span key={i}>
              {row.label}
              <span className="font-medium"> | </span>
              {row.values.map((value, n) => (
                <React.Fragment key={n}>
                  {n > 0 && <span className="font-bold"> . </span>}
                  <span className="font-medium">{value}</span>
                </React.Fragment>
              ))}
            </span>
          ))}
          origin={
            origin
              ? { mark: <FlagIcon iso={origin.iso} isFromProductPage />, text: origin.text }
              : null
          }
          video={video}
          onVideo={() => setVideoOpen(true)}
          Likes={RealLikes}
          ask={{
            placeholder: body("Ask Seller Your Question About This Product …"),
            sending: question.loading,
            canAsk: signedInOrAsk,
            send: question.send,
          }}
          onReviewsSeen={() =>
            GAevent({
              action: GA_EVENT_NAMES.VIEW_COMMENTS,
              params: {
                user_id_custom: auth.UserID(),
                item_id: analytics.item_id,
                item_name: analytics.item_name,
                brand_id: analytics.brand_id,
                category: analytics.category,
                category_id: analytics.category_id,
                brand: analytics.brand,
                price: analytics.price,
              },
            })
          }
        />
        <Toast text={toast} bottom={110} fixed />
      </div>
      {/* The zoom overlay. After the page: it finds the gallery's photos when it mounts. */}
      <ActiveColorDetailsSlider
        serverColor={serverColor}
        productGA={analytics}
        imagesByColor={imagesByColor}
      />
      {mounted &&
        createPortal(
          <div
            className="product-details-footer alternate-product-details-footer z-999999999"
            dir={pageDir}
            style={more ? { minHeight: 0 } : { display: "none" }}
          >
            {more && <OverlayForClose close={() => setMore(false)} />}
            <ExtendedAreaInfo product_data={light} active={more} option="More" />
          </div>,
          document.body,
        )}
      {mounted && videoOpen && (
        <VideoOverlay videos={videos} onClose={() => setVideoOpen(false)} label={t("Video")} />
      )}
    </MotionConfig>
  );
}
