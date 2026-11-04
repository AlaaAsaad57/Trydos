"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import GoToSellerDashBoard from "components/settings/GoToSellerDashBoard";
import NotificationSkeleton from "components/skeleton/NotificationSkeleton";
import { getLocalizedCountryName } from "utils/countryData";
import { C, ROW, fill } from "../demo1Layout";
import { useDemoNav } from "../screenNav";
import { ScreenHeader, ScreenPage, Txt } from "../ui";

// The old notifications list, an overlay over the page. It was the old
// account menu's; that menu went with the old top nav (Stage 3, S3-9).
const NotificationsPanel = dynamic(
  () => import("components/Notifications/NotificationsPanel"),
  { ssr: false, loading: () => <NotificationSkeleton /> },
);

/**
 * Settings — behind the profile's "Settings" row (D-19, D-22, S4-2). The XD
 * file has no board for it, so the designer must check it.
 *
 * Built like the Profile menu (XD `Home Page – 16`): the header, then 60 px
 * rows from 20 under it, 4 px apart, radius 15, `#FCFCFC`, a 30 px icon 12 px
 * in and the 14 px label at x 66. The icons are the old settings page's.
 *
 * Each row opens the old UI: the notifications list (an overlay), the
 * notification topics, My Checklist, the country and the language pages.
 * Under the rows sits the old seller card as it is (become a seller, or the
 * sales link for a shopper with a shop), with its own loading and retry.
 */
export default function SettingsScreen() {
  const { t, back, locale } = useDemoNav();
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [country, language] = locale.split("-");

  const rows: {
    id: string;
    icon: string;
    label: string;
    onClick: () => void;
  }[] = [
    {
      id: "notifications",
      icon: "/icons/NotificationIcon.svg",
      label: t("Notifications"),
      onClick: () => setNotificationsOpen(true),
    },
    {
      id: "notification-settings",
      icon: "/icons/SettingsIcon.svg",
      label: t("Notification Settings"),
      onClick: () => router.push(`/${locale}/settings/prefferences`),
    },
    {
      id: "checklist",
      icon: "/icons/Heart.svg",
      label: t("My Checklist"),
      onClick: () => router.push(`/${locale}/settings/checklist`),
    },
    {
      id: "country",
      icon: `/icons/flag/${country}.svg`,
      // The country the app is in, in the page's language, as the old page.
      label: getLocalizedCountryName(country, language),
      onClick: () => router.push(`/${locale}/settings/countries`),
    },
    {
      id: "language",
      icon: "/icons/LanguageIcon.svg",
      label: t("Language"),
      onClick: () => router.push(`/${locale}/settings/languages`),
    },
  ];

  return (
    <ScreenPage
      testId="app-settings"
      header={<ScreenHeader title="Settings" onBack={back} t={t} />}
    >
      {rows.map((row, i) => (
        <motion.button
          key={row.id}
          type="button"
          data-pw={`app-settings-${row.id}`}
          onClick={row.onClick}
          whileTap={{ scale: 0.985 }}
          className="flex items-center shrink-0 cursor-pointer text-start"
          style={{
            marginTop: i === 0 ? 20 : 4,
            marginInlineStart: ROW.x,
            width: fill(ROW.x),
            height: 60,
            borderRadius: ROW.radius,
            background: C.card,
          }}
        >
          <img
            src={row.icon}
            alt=""
            width={30}
            height={30}
            className="shrink-0 object-contain"
            style={{ marginInlineStart: 12, width: 30, height: 30 }}
          />
          <Txt size={14} style={{ marginInlineStart: 66 - ROW.x - 12 - 30 }}>
            {row.label}
          </Txt>
        </motion.button>
      ))}

      <div
        className="shrink-0"
        style={{ marginTop: 4, marginInlineStart: ROW.x, width: fill(ROW.x) }}
      >
        <GoToSellerDashBoard language={language} />
      </div>

      {notificationsOpen && (
        <NotificationsPanel
          closeWindow={() => setNotificationsOpen(false)}
          onClose={() => setNotificationsOpen(false)}
        />
      )}
    </ScreenPage>
  );
}
