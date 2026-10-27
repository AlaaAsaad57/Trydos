"use client";

import { motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import type { DemoKey } from "../../DemoApp/demoKeys";
import { C } from "../demo1Layout";
import { Sheet, Txt } from "../ui";
import AnimatedEmoji, {
  POPULAR_REACTIONS,
  PRIMARY_REACTIONS,
} from "./AnimatedEmoji";

/**
 * Standard emojis organized for WhatsApp-style reaction picker.
 */
const SMILEYS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸",
  "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️",
  "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😮", "😯", "😲",
  "😳", "🤯", "😱", "😨", "😰", "😥", "😓", "🤔", "🫡", "🤐",
  "😶", "😐", "😑", "😬", "🥱", "😴", "🤤", "😷", "🤒", "🤕",
  "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤠", "😈", "👿",
  "💀", "☠️", "👻", "👽", "👾", "🤖", "💩",
] as const;

const GESTURES_AND_HEARTS = [
  "👍", "👎", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️",
  "💪", "👈", "👉", "👆", "👇", "☝️", "✌️", "🤞", "🫰", "🤟",
  "🤘", "🤙", "🖐️", "✋", "🖖", "👋", "❤️", "🧡", "💛", "💚",
  "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓",
  "💗", "💖", "💘", "💝", "💟",
] as const;

const OBJECTS_AND_ACTIVITIES = [
  "🔥", "💯", "✨", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "⭐",
  "🌟", "⚡", "🌈", "💥", "🍕", "🍔", "🥑", "🍩", "🍦", "🍿",
  "☕", "🍾", "🍻", "⚽", "🏀", "🏈", "🎾", "🎯", "🚀", "🚗",
  "✈️", "🚲", "💡", "📱", "💻", "📷", "💎", "🔔", "🎶", "⚠️",
  "✅", "❌", "❓", "❗",
] as const;

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "recent", label: "Recent" },
  { id: "popular", label: "Popular" },
  { id: "smileys", label: "Smileys" },
  { id: "gestures", label: "Gestures" },
  { id: "objects", label: "Symbols" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

const EMOJI_KEYWORDS: Record<string, string[]> = {
  "👍": ["thumbs up", "like", "yes", "good", "approve", "ok"],
  "👎": ["thumbs down", "dislike", "no", "bad", "disapprove"],
  "❤️": ["heart", "love", "red heart", "like"],
  "😂": ["laugh", "tears", "joy", "lol", "haha", "crying laughing"],
  "🤣": ["rofl", "rolling", "laugh", "lol", "haha"],
  "😮": ["open mouth", "wow", "surprise", "omg", "shock"],
  "😢": ["cry", "tear", "sad", "unhappy"],
  "🙏": ["pray", "please", "thanks", "thank you", "hope", "folded hands"],
  "😘": ["kiss", "love", "blow kiss", "affection"],
  "🔥": ["fire", "lit", "hot", "flame"],
  "🎉": ["party", "tada", "celebration", "popper", "congrats"],
  "👏": ["clap", "applause", "bravo", "hands"],
  "😍": ["heart eyes", "love", "crush", "adore"],
  "🤔": ["think", "thinking", "hmm", "ponder"],
  "😊": ["smile", "happy", "blush", "kind"],
  "😉": ["wink", "flirt", "playful"],
  "🤩": ["star eyes", "star struck", "excited", "wow"],
  "😎": ["cool", "sunglasses", "confident"],
  "👀": ["eyes", "look", "see", "watching"],
  "💯": ["100", "hundred", "perfect", "score"],
  "🚀": ["rocket", "ship", "launch", "moon", "fast"],
  "✨": ["sparkles", "shine", "magic", "stars"],
  "💔": ["broken heart", "heartbreak", "sad", "breakup"],
  "💀": ["skull", "dead", "died", "skeleton"],
  "🙌": ["hands up", "celebrate", "hooray", "praise"],
  "🫡": ["salute", "respect", "yes sir"],
  "😱": ["scream", "scared", "fear", "shock"],
  "🥳": ["party face", "celebrate", "birthday", "hat"],
  "🥺": ["pleading", "puppy eyes", "begging", "cute"],
  "🤝": ["handshake", "deal", "agree", "partner"],
  "🤯": ["mind blown", "exploding head", "shocked"],
  "😏": ["smirk", "suggestive", "sly"],
  "✅": ["check", "done", "correct", "mark", "yes"],
  "🥰": ["love", "smile", "hearts", "adore", "affection"],
  "😜": ["wink", "tongue", "crazy", "silly"],
  "🤪": ["zany", "wild", "crazy", "goofy"],
  "🤑": ["money", "rich", "dollar", "cash"],
  "🤤": ["drool", "delicious", "yummy", "craving"],
  "😴": ["sleep", "tired", "sleepy", "zzz", "bed"],
  "🤐": ["zipper", "quiet", "silent", "secret"],
  "🤨": ["eyebrow", "suspicious", "skeptical", "doubt"],
  "😐": ["neutral", "meh", "blank"],
  "😑": ["expressionless", "done", "annoyed"],
  "🙄": ["eye roll", "whatever", "bored"],
  "😬": ["grimace", "awkward", "oops", "nervous"],
  "🤥": ["lying", "pinocchio", "liar"],
  "😌": ["relieved", "calm", "peaceful", "zen"],
  "😔": ["pensive", "sad", "down", "sorrow"],
  "😷": ["mask", "sick", "covid", "virus"],
  "🤒": ["thermometer", "fever", "ill", "sick"],
  "🤕": ["bandage", "hurt", "injured", "pain"],
  "🤢": ["nauseated", "gross", "disgusted", "sick"],
  "🤮": ["vomit", "puke", "disgust", "barf"],
  "🤧": ["sneeze", "cold", "tissue", "allergy"],
  "🥵": ["hot", "sweating", "heat", "overheated"],
  "🥶": ["cold", "freezing", "ice", "frost"],
  "🥴": ["woozy", "drunk", "dizzy", "tipsy"],
  "😵": ["dizzy", "knocked out", "dead"],
  "🤠": ["cowboy", "hat", "howdy"],
  "🥸": ["disguise", "glasses", "incognito"],
  "🤓": ["nerd", "geek", "smart", "glasses"],
  "🧐": ["monocle", "curious", "inspect", "hmm"],
  "😭": ["cry", "sobbing", "tears", "bawling"],
  "😤": ["triumph", "steam", "proud", "frustrated"],
  "😡": ["rage", "angry", "furious", "mad"],
  "😠": ["angry", "grumpy", "mad"],
  "🤬": ["curse", "swear", "furious", "angry"],
  "😈": ["devil", "evil", "naughty", "horns"],
  "👿": ["imp", "devil", "angry horns"],
  "💩": ["poop", "poo", "crap"],
  "🤡": ["clown", "fool", "circus"],
  "👻": ["ghost", "spooky", "boo", "halloween"],
  "👽": ["alien", "ufo", "space", "martian"],
  "👾": ["monster", "space invader", "arcade", "game"],
  "🤖": ["robot", "bot", "ai", "machine"],
  "🫶": ["heart hands", "love", "care", "support"],
  "✌️": ["peace", "victory", "two"],
  "🤞": ["fingers crossed", "luck", "hope"],
  "🤟": ["love you", "ily", "hand"],
  "🤘": ["rock on", "metal", "horns"],
  "🤙": ["call me", "shaka", "hang loose"],
  "👋": ["wave", "hello", "hi", "bye"],
  "👌": ["ok", "perfect", "okay", "fine"],
  "🤌": ["pinched fingers", "italian", "mamma mia"],
  "👊": ["fist", "punch", "brofist", "bump"],
  "💪": ["muscle", "flex", "strong", "power"],
  "💖": ["sparkle heart", "love", "glitter"],
  "💗": ["growing heart", "pulse", "love"],
  "💓": ["beating heart", "thump", "love"],
  "💞": ["revolving hearts", "love", "circle"],
  "💕": ["two hearts", "love", "romance"],
  "💘": ["cupid", "arrow", "love struck"],
  "💝": ["gift heart", "ribbon", "present"],
  "💥": ["boom", "collision", "explode", "bang"],
  "🌟": ["star", "glowing", "bright", "shining"],
  "⭐": ["star", "favorite", "gold"],
  "⚡": ["lightning", "zap", "electric", "power", "energy"],
  "🌈": ["rainbow", "pride", "colors"],
  "💎": ["diamond", "gem", "jewel", "precious"],
  "🏆": ["trophy", "winner", "first", "champion"],
  "🥇": ["medal", "gold", "first place", "winner"],
  "🎁": ["gift", "present", "box", "birthday"],
  "🎈": ["balloon", "party", "celebrate"],
  "🎊": ["confetti", "celebration", "party"],
  "🍾": ["champagne", "bottle", "cork", "celebrate"],
  "🍻": ["beer", "cheers", "drinks", "bar"],
  "☕": ["coffee", "tea", "cafe", "warm"],
  "🍕": ["pizza", "slice", "cheese", "food"],
  "🍔": ["burger", "hamburger", "fast food"],
  "🥑": ["avocado", "guac", "healthy"],
  "🍩": ["donut", "doughnut", "sweet"],
  "🍦": ["ice cream", "dessert", "sweet"],
  "🍿": ["popcorn", "movie", "cinema"],
  "🎯": ["target", "bullseye", "hit", "goal"],
  "🎶": ["music", "notes", "song", "melody"],
  "🔔": ["bell", "ring", "notification", "alert"],
  "💡": ["lightbulb", "idea", "bright", "lamp"],
  "❌": ["cross", "x", "no", "wrong", "cancel"],
  "⚠️": ["warning", "caution", "alert", "danger"],
  "❓": ["question", "what", "help", "confused"],
  "❗": ["exclamation", "important", "alert", "attention"],
};

export default function ReactionSheet({
  open,
  currentReaction,
  onPick,
  onClose,
  t,
}: {
  open: boolean;
  currentReaction?: string;
  onPick: (emoji: string, from: { x: number; y: number; size: number }) => void;
  onClose: () => void;
  t: (key: DemoKey) => string;
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<CategoryId>("all");

  const recentList = useMemo(() => Array.from(PRIMARY_REACTIONS), []);
  const popularList = useMemo(() => Array.from(POPULAR_REACTIONS), []);

  const allEmojisList = useMemo(() => {
    const set = new Set<string>();
    recentList.forEach((e) => set.add(e));
    popularList.forEach((e) => set.add(e));
    SMILEYS.forEach((e) => set.add(e));
    GESTURES_AND_HEARTS.forEach((e) => set.add(e));
    OBJECTS_AND_ACTIVITIES.forEach((e) => set.add(e));
    return Array.from(set);
  }, [recentList, popularList]);

  const filteredEmojis = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return allEmojisList.filter((emoji) => {
        if (emoji.includes(q)) return true;
        const keywords = EMOJI_KEYWORDS[emoji] ?? [];
        return keywords.some((kw) => kw.toLowerCase().includes(q));
      });
    }

    switch (activeTab) {
      case "recent":
        return recentList;
      case "popular":
        return popularList;
      case "smileys":
        return Array.from(SMILEYS);
      case "gestures":
        return Array.from(GESTURES_AND_HEARTS);
      case "objects":
        return Array.from(OBJECTS_AND_ACTIVITIES);
      case "all":
      default:
        return allEmojisList;
    }
  }, [query, activeTab, allEmojisList, recentList, popularList]);

  return (
    <Sheet open={open} onClose={onClose} y={340} testId="demo-reaction-sheet">
      <div className="flex flex-col w-full px-4 pt-1 pb-6 overflow-hidden">
        {/* Header Title */}
        <Txt center size={16} weight="medium" mt={4} className="mb-2.5">
          {t("Search") === "Search" ? "Reactions" : t("Search")}
        </Txt>

        {/* Search Bar */}
        <div className="relative flex items-center w-full mb-3 shrink-0">
          <span
            aria-hidden="true"
            className="absolute left-3.5 flex items-center justify-center text-neutral-400 pointer-events-none"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            data-pw="demo-reaction-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emoji"
            className="w-full h-9 pl-9 pr-8 text-[14px] rounded-xl outline-none transition-colors"
            style={{
              background: "rgba(118, 118, 128, 0.12)",
              color: C.ink,
            }}
          />
          {query.trim() !== "" && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-neutral-300 active:opacity-70 text-white"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Pills (hidden when searching) */}
        {!query.trim() && (
          <div className="flex items-center gap-1.5 pb-2 mb-2 overflow-x-auto no-scrollbar shrink-0">
            {CATEGORIES.map((cat) => {
              const active = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className="px-3 py-1 text-[13px] font-medium rounded-full transition-all shrink-0 cursor-pointer"
                  style={{
                    background: active ? C.ink : "rgba(118, 118, 128, 0.08)",
                    color: active ? C.white : C.grey,
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Emojis Grid Container */}
        <div
          data-pw="demo-reaction-grid"
          className="grid grid-cols-6 gap-y-2 place-items-center w-full overflow-y-auto pr-1"
          style={{
            maxHeight: 380,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {filteredEmojis.map((emoji) => {
            const isChosen = currentReaction === emoji;
            return (
              <motion.button
                key={emoji}
                type="button"
                data-pw={`demo-reaction-item-${emoji}`}
                whileTap={{ scale: 1.25 }}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  onPick(emoji, {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    size: 30,
                  });
                }}
                className="relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer select-none transition-colors active:bg-black/5"
                style={{
                  background: isChosen ? "rgba(0, 0, 0, 0.09)" : undefined,
                  boxShadow: isChosen ? "0 0 0 1px rgba(0, 0, 0, 0.08)" : undefined,
                }}
              >
                <AnimatedEmoji emoji={emoji} size={30} />
              </motion.button>
            );
          })}

          {filteredEmojis.length === 0 && (
            <div className="col-span-6 py-12 text-center text-neutral-400 text-[14px]">
              No emoji found
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
