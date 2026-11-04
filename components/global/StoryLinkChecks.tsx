"use client";

import { translateFunction } from "utils/functions";
import { MAX_STORY_LINK_LENGTH, type StoryLinkCheck } from "utils/storyLink";

// The rules under a story's link field: a green check or a red cross for each,
// updated on every key press. Both rules always show, so a link that is bad
// AND too long says both.

const Mark = ({ ok }: { ok: boolean }) => (
  <span
    aria-hidden
    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
      ok ? "bg-[#22a06b]" : "bg-[#f85555]"
    }`}
  >
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ok ? <path d="M2.2 5.2 4.1 7 7.8 3" /> : <path d="M3.2 3.2l3.6 3.6M6.8 3.2 3.2 6.8" />}
    </svg>
  </span>
);

const Rule = ({
  pw,
  ok,
  label,
  children,
}: {
  pw: string;
  ok: boolean;
  label: string;
  children?: React.ReactNode;
}) => (
  <li data-pw={pw} data-state={ok ? "pass" : "fail"} className="flex items-center gap-2">
    <Mark ok={ok} />
    <span className={`transition-colors duration-200 ${ok ? "text-[#8e8e8e]" : "text-[#f85555]"}`}>
      {label}
      <span className="sr-only">
        {" — "}
        {ok ? translateFunction("Passed") : translateFunction("Failed")}
      </span>
    </span>
    {children}
  </li>
);

export default function StoryLinkChecks({
  id,
  check,
  refusalPw,
}: {
  /** Point the input's aria-describedby at this. */
  id: string;
  check: StoryLinkCheck;
  /** data-pw set on the list only while the link is refused. */
  refusalPw?: string;
}) {
  if (check.empty) return null;
  return (
    <ul
      id={id}
      data-pw={check.valid ? undefined : refusalPw}
      className="mt-2 flex flex-col gap-1.5 text-[12px] leading-4"
    >
      <Rule pw="story-link-check-url" ok={check.isUrl} label={translateFunction("A valid link, like example.com")} />
      <Rule pw="story-link-check-length" ok={check.isShort} label={translateFunction("200 characters or fewer")}>
        <span
          dir="ltr"
          className={`ms-auto tabular-nums transition-colors duration-200 ${
            check.isShort ? "text-[#b4b4b4]" : "text-[#f85555]"
          }`}
        >
          {check.length}/{MAX_STORY_LINK_LENGTH}
        </span>
      </Rule>
    </ul>
  );
}
