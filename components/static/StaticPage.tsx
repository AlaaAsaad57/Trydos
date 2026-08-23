import BackBar from "components/setting/BackBar";
import { translateFunction } from "utils/server";

type Section = { heading: string; body: string };

/**
 * Shared server-rendered layout for the static "trust" pages (About, Privacy,
 * Terms, Contact). Content is passed as English source strings and localised via
 * `translateFunction` (falls back to the English key when no translation exists).
 */
export default function StaticPage({
  lang,
  title,
  intro,
  sections,
}: {
  lang: string;
  title: string;
  intro?: string;
  sections: Section[];
}) {
  const [, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  const t = (key: string) => translateFunction(key, language);

  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] pb-[40px] flex setting-screen"
      style={{ direction: isRtl ? "rtl" : "ltr" }}
      data-pw="static-page"
    >
      <BackBar
        isRtl={isRtl}
        local={lang}
        name={t(title)}
        preivous_page={`/${lang}/settings`}
        DataCy="static-page-back"
      />
      <article
        className={`flex-col flex w-full mt-[12px] gap-[20px] ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        <h1
          className="text-[#1D1D1D] text-[22px] medium"
          data-pw="static-page-title"
        >
          {t(title)}
        </h1>
        {intro && (
          <p className="text-[#5A5A5A] text-[15px] regular leading-[1.8]">
            {t(intro)}
          </p>
        )}
        {sections.map((section) => (
          <section key={section.heading} className="flex-col flex gap-[6px]">
            <h2 className="text-[#1D1D1D] text-[17px] medium">
              {t(section.heading)}
            </h2>
            <p className="text-[#5A5A5A] text-[15px] regular leading-[1.8] whitespace-pre-line">
              {t(section.body)}
            </p>
          </section>
        ))}
      </article>
    </div>
  );
}
