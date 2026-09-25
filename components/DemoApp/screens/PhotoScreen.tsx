"use client";

import type { DemoKey } from "../demoKeys";
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "../XdIcon";
import { useDemoNav } from "../DemoShell";
import { useDemoData } from "../DemoData";
import { C, lineBox } from "../demoLayout";
import { ScreenHeader, ScreenPage, WhyCard, WideButton } from "../ui";
import type { XdIconName } from "../xdIcons";

/**
 * Profile photo — five XD artboards, one screen:
 *
 *   `Home Page – 10`  empty: the 350 x 350 box (radius 30) with the grey user,
 *                     "Choose" and "Take Photo", and the grey card under them;
 *   `Home Page – 12`  picking: a white sheet with a soft top shadow rises from
 *                     y 120 while the phone's own picker is open;
 *   `Home Page – 13`  uploading: the grey try mark turns in the box, and
 *                     "Uploading profile photo …" under it;
 *   `Home Page – 14`  preview: the photo (1.5 white line, shadow 0 3 3 at 16%)
 *                     and "Add & save";
 *   `Home Page – 15`  saved: the photo with Choose, Take Photo and Remove.
 *
 * Nothing is uploaded: the design is waiting for approval, so the "upload" is
 * a short wait and the photo stays in this browser (an object URL).
 */

type Stage = "empty" | "picking" | "uploading" | "preview" | "saved";

/** How long the demo "upload" takes, so the uploading state can be seen. */
const UPLOAD_MS = 1600;

export default function PhotoScreen() {
  const { t, back } = useDemoNav();
  const { profile, update } = useDemoData();
  const [stage, setStage] = useState<Stage>(profile.photo ? "saved" : "empty");
  const [draft, setDraft] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(true);
  const chooseRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stage !== "uploading") return;
    const timer = setTimeout(() => setStage("preview"), UPLOAD_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  const open = (input: HTMLInputElement | null) => {
    if (!input) return;
    setStage("picking");
    input.value = "";
    input.click();
  };

  const onPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setStage(profile.photo ? "saved" : "empty");
      return;
    }
    setDraft(URL.createObjectURL(file));
    setStage("uploading");
  };

  // The picker was closed without a photo. React has no prop for the input's
  // `cancel` event yet, so it is listened to directly.
  useEffect(() => {
    const inputs = [chooseRef.current, cameraRef.current];
    const onCancelPick = () => setStage(profile.photo ? "saved" : "empty");
    inputs.forEach((input) => input?.addEventListener("cancel", onCancelPick));
    return () =>
      inputs.forEach((input) =>
        input?.removeEventListener("cancel", onCancelPick),
      );
  }, [profile.photo]);

  const cancel = () => {
    setDraft(null);
    setStage(profile.photo ? "saved" : "empty");
  };

  const photo = stage === "saved" ? profile.photo : draft;
  const showCancel =
    stage === "picking" || stage === "uploading" || stage === "preview";

  const actions: { icon: XdIconName; label: DemoKey; onClick: () => void }[] = [
    { icon: "choose", label: "Choose", onClick: () => open(chooseRef.current) },
    {
      icon: "takePhoto",
      label: "Take Photo",
      onClick: () => open(cameraRef.current),
    },
  ];
  if (stage === "saved")
    actions.push({
      icon: "remove",
      label: "Remove",
      onClick: () => {
        update({ photo: null });
        setStage("empty");
      },
    });

  return (
    <ScreenPage
      testId="demo-photo"
      header={
        <ScreenHeader
          title="Profile Photo"
          nudge={1}
          onBack={back}
          action={showCancel ? "Cancel" : undefined}
          onAction={cancel}
          t={t}
        />
      }
      footer={
        <>
          {/* 771 .. 895 in the file: 37 above the bottom. */}
          <AnimatePresence>
            {showWhy && stage === "empty" && (
              <WhyCard
                key="why"
                bottom={37}
                t={t}
                onClose={() => setShowWhy(false)}
              />
            )}
          </AnimatePresence>
          <WideButton
            testId="demo-photo-save"
            label={t("Add & save")}
            visible={stage === "preview"}
            onClick={() => {
              update({ photo: draft });
              setDraft(null);
              setStage("saved");
            }}
          />
        </>
      }
    >
      <input
        ref={chooseRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPicked}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={onPicked}
      />

      {/* The box. Empty and uploading share the grey look; a photo gets the white line and shadow. */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: 40,
          top: 120,
          width: 350,
          height: 350,
          borderRadius: 30,
          background: C.card,
          boxShadow:
            photo && stage !== "uploading"
              ? "0 3px 3px rgba(0,0,0,0.16)"
              : "inset 0 0 0 0.5px #D3D3D3",
          transition: "box-shadow 0.3s",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {photo && stage !== "uploading" ? (
            <motion.img
              key="photo"
              src={photo}
              alt=""
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ borderRadius: 30 }}
            />
          ) : stage === "uploading" ? (
            <motion.div
              key="uploading"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* The mark turns while the photo "uploads". 151 x 151 at (139.5, 219.5), the box's centre. */}
              <motion.div
                className="absolute"
                style={{ left: 99.5, top: 99.5 }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
              >
                <XdIcon name="uploadingMark" />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <XdIcon
                name="avatarBig"
                style={{ position: "absolute", left: 64.68, top: 42.45 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* The white line is its own layer over the photo: an inset shadow on
            the box itself is painted under the <img> and never shows. */}
        {photo && stage !== "uploading" && (
          <span
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: 30, boxShadow: "inset 0 0 0 1.5px #FFFFFF" }}
          />
        )}
      </div>

      {stage === "uploading" ? (
        <div
          className="absolute left-0 w-full flex justify-center items-center"
          style={{ top: 490, height: 18 }}
        >
          <XdIcon name="uploadingIcon" />
          <span
            className="font-normal"
            style={{
              marginLeft: 6,
              fontSize: 14,
              lineHeight: `${lineBox(14)}px`,
              color: C.hint,
            }}
          >
            {t("Uploading profile photo …")}
          </span>
        </div>
      ) : (
        // Icons 20 x 20 at y 490, labels 11 px on baseline 527, each label
        // centred under its icon, the icons 88 apart. Two actions centre on
        // 167 and 255 — the pair sits 4 px left of the middle in the file,
        // hence the padding. Three centre on 126, 214 and 303: the row sits
        // 1 px left of the middle, and "Remove" is 1 px further right.
        <div
          className="absolute left-0 w-full flex justify-center"
          style={{ top: 490, gap: 28, paddingRight: stage === "saved" ? 2 : 8 }}
        >
          {actions.map((action) => (
            <motion.button
              key={action.label}
              type="button"
              data-pw={`demo-photo-${action.label.toLowerCase().replace(" ", "-")}`}
              whileTap={{ scale: 0.92 }}
              onClick={action.onClick}
              className="relative flex flex-col items-center cursor-pointer"
              style={{
                width: 60,
                marginLeft: action.icon === "remove" ? 1 : undefined,
              }}
            >
              <XdIcon name={action.icon} />
              <span
                className="absolute font-normal whitespace-nowrap"
                style={{
                  top: 527 - 11 - 490,
                  fontSize: 11,
                  lineHeight: `${lineBox(11)}px`,
                  color: C.ink,
                }}
              >
                {t(action.label)}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      {/* `Home Page – 12`: while the phone's picker is open. */}
      <AnimatePresence>
        {stage === "picking" && (
          <motion.div
            className="absolute left-0 w-full"
            style={{
              top: 120,
              height: 812,
              background: C.white,
              borderRadius: "30px 30px 0 0",
              boxShadow: "0 -3px 10px rgba(0,0,0,0.1)",
              zIndex: 4,
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 34,
              mass: 0.9,
            }}
          />
        )}
      </AnimatePresence>
    </ScreenPage>
  );
}
