"use client";

import React, { useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoCase } from "../demoCase";
import { C } from "../demo1Layout";
import { ScreenPage } from "../ui";
import { SearchHeader } from "./SearchHeader";

/**
 * Search on /demo — XD `Home Page – 1`. The file only has this first state;
 * there is no results design, so the field takes text and nothing is
 * searched. The header is SearchHeader.tsx, which the app's search page
 * (/[lang]/search) draws too, with the real search.
 */
const CHIPS = ["For you", "Empty", "Empty", "Empty", "Empty", "Empty"] as const;

export default function SearchScreen() {
  // Apple's capital rules (D-4): title style for labels and chips, sentence
  // style for the placeholder.
  const { t, body } = useDemoCase();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(0);

  return (
    <ScreenPage
      testId="demo-search"
      bg={C.page}
      header={
        <SearchHeader
          placeholder={body("Search anything…")}
          value={query}
          onChange={setQuery}
          voice={
            <button
              type="button"
              aria-label={t("Voice search")}
              className="block cursor-pointer active:opacity-60"
            >
              <XdIcon name="searchVoice" />
            </button>
          }
          scan={
            <button
              type="button"
              aria-label={t("Scan")}
              className="block cursor-pointer active:opacity-60"
            >
              <XdIcon name="searchScan" />
            </button>
          }
          chips={CHIPS.map((name) => t(name))}
          picked={picked}
          onPick={setPicked}
        />
      }
      tabBar
    >
      {null}
    </ScreenPage>
  );
}
