import { lang as langParam } from "next/root-params";
import OrderJourney, { type JourneyWords } from "components/orderTimeline/OrderJourney";
import OrderParcelJourney, {
  type ParcelJourneyWords,
} from "components/orderParcelJourney/OrderParcelJourney";
import { translateFunction } from "utils/server";

/*
  /[lang]/timeline — shows the animated order timeline (components/orderTimeline).
  The page plays the whole story. The buttons under the card replay it, slow it
  down, or jump to one order status.

  The words are translated here, on the server, and passed down to the card.
*/

const TITLE = "Order Journey";

// The site header is hidden on this page, the same way /demo hides it
// (components/DemoApp1/demo1Layout.ts HIDE_SITE_CHROME).
const HIDE_SITE_HEADER = "body:has([data-oj-page]) .home-navbar { display: none !important; }";

async function language() {
  return (await langParam()).split("-")[1] || "en";
}

export async function generateMetadata() {
  return {
    title: `${translateFunction(TITLE, await language())} | Trydos`,
    robots: { index: false, follow: false },
  };
}

export default async function Page() {
  const lang = await language();
  const t = (key: string) => translateFunction(key, lang);
  const words: JourneyWords = {
    title: t(TITLE),
    label: t("The product is bought, packed, flown and driven to you"),
    buy: t("Buy"),
    preparing: t("Preparing"),
    shipped: t("Shipped"),
    out: t("Out for delivery"),
    delivered: t("Delivered"),
    today: t("Today"),
    inHour: t("In 1 Hour"),
    inHours: t("In 6 Hours"),
    inDays: t("In 3 Work Days"),
    inHands: t("In Your Hands"),
    expected: t("Expected Delivery"),
    playAgain: t("Play Again"),
    slow: t("Slow Motion"),
    statusGroup: t("Order Status"),
  };

  const parcelWords: ParcelJourneyWords = {
    ...words,
    play: t("Play"),
    pause: t("Pause"),
    normal: t("Normal"),
  };

  return (
    <main data-oj-page className="flex min-h-dvh w-full justify-center bg-[#F4F4F4] px-[16px] py-[32px]">
      <style>{HIDE_SITE_HEADER}</style>
      <div className="flex w-full max-w-[780px] flex-col gap-[32px]">
        <div className="flex flex-col gap-[16px]">
          <h1 className="text-[24px] font-bold text-[#1D1D1D]">{words.title}</h1>
          <OrderJourney words={words} rtl={lang === "ar" || lang === "ku"} />
        </div>
        <div className="flex flex-col gap-[16px] border-t border-[#E8E8E8] pt-[24px]">
          <OrderParcelJourney
            words={parcelWords}
            rtl={lang === "ar" || lang === "ku"}
          />
        </div>
      </div>
    </main>
  );
}
