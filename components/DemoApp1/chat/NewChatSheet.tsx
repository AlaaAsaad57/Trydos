"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { allCountries } from "country-telephone-data";
import { phoneWithDialCode } from "components/Chat/contactPhone";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import { getLocalizedCountryName } from "utils/countryData";
import type { Contact } from "./chatModel";
import { C, CTA, ROW, fill, lineBox, textTop } from "../demo1Layout";
import { Field, FieldInput, Sheet, Stroke, Txt, Under } from "../ui";
import { PlusIcon } from "./chatIcons";

/**
 * "New chat": the sheet the round purple button of the Chats tab opens. The
 * demo's bottom sheet (`Sheet`), in the "Forward to" sheet's manner —
 * the title 16 Medium centred, then 60 px rows on the `#FCFCFC` card, 12 px
 * from both edges, 2 px apart:
 *
 *   - the first row, "New contact": a plus in a round pale-purple box where
 *     the photo goes;
 *   - then a row per contact: the photo (radius 15, or the grey box with
 *     the initials), the name 14 Medium and the number 12 Regular grey.
 *
 * "New contact" turns the sheet into the profile forms' fields (`Field`,
 * `FieldInput`): the name and the phone number, with the wide purple
 * "Add & save" button of the forms under them, and "Cancel" at the top
 * right to come back to the list. The button waits until both are filled.
 *
 * The phone field starts with the old form's country code picker
 * (ChatContactsUpload.tsx; the owner's choice, 2026-11-04): the flag and the
 * code, with the phone's own country list on a tap. The number is sent with
 * its code (`phoneWithDialCode`). It stays left to right on every page (A-30).
 */

/** The old form's default code: Syria. */
const DEFAULT_DIAL = "+963";
export default function NewChatSheet({
  open,
  contacts,
  onPick,
  onAdd,
  onSync,
  onClose,
  t,
}: {
  open: boolean;
  contacts: Contact[];
  /** A contact was tapped: open the chat with them. */
  onPick: (contact: string) => void;
  /** The form was saved: add the contact (full number, with its country code) and open the chat with them. */
  onAdd: (name: string, phone: string) => void;
  /**
   * The real chat only, where the browser can read the phone's contacts:
   * "Get from your contacts" saves the picked ones (D-36b, no XD board).
   */
  onSync?: () => Promise<void>;
  onClose: () => void;
  t: (key: DemoKey) => string;
}) {
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dial, setDial] = useState(DEFAULT_DIAL);
  const language = useAppStore((s) => s.language);
  const country = allCountries.find((c) => `+${c.dialCode}` === dial);

  // The sheet opens on the list every time, with an empty form behind it.
  useEffect(() => {
    if (!open) return;
    setAdding(false);
    setName("");
    setPhone("");
    setDial(DEFAULT_DIAL);
  }, [open]);

  const fullPhone = phoneWithDialCode(dial, phone);
  const canSave = name.trim() !== "" && fullPhone !== "";
  const save = () => {
    if (!canSave) return;
    onAdd(name, fullPhone);
  };

  return (
    <Sheet open={open} onClose={onClose} y={300} testId="demo-new-chat-sheet">
      <div className="relative flex shrink-0 justify-center" style={{ height: 30 }}>
        <Txt center size={16} weight="medium" mt={textTop(30, 16) - 8}>
          {t(adding ? "New contact" : "New chat")}
        </Txt>
        <AnimatePresence>
          {adding && (
            <motion.button
              key="cancel"
              type="button"
              data-pw="demo-new-chat-cancel"
              onClick={() => setAdding(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute font-light cursor-pointer active:opacity-60"
              style={{
                insetInlineEnd: 20,
                top: textTop(30, 16) - 8,
                fontSize: 16,
                lineHeight: `${lineBox(16)}px`,
                color: C.ink,
              }}
            >
              {t("Cancel")}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <Under testId="demo-new-chat-body">
        <AnimatePresence initial={false} mode="wait">
          {adding ? (
            <motion.div
              key="form"
              className="flex flex-col w-full shrink-0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.12 } }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Field mt={16} label={t("full Name")} editing>
                <FieldInput
                  testId="demo-new-contact-name"
                  value={name}
                  placeholder={t("Enter Full Name")}
                  onChange={setName}
                  editing
                />
              </Field>
              <Field mt={4} label={t("Phone Number")} editing>
                <span dir="ltr" className="flex w-full items-center" style={{ gap: 8 }}>
                  <span className="relative flex shrink-0 items-center" style={{ gap: 4, marginTop: 3, height: 23 }}>
                    {country && (
                      <img
                        src={`/icons/flag/${country.iso2}.svg`}
                        alt=""
                        className="object-cover"
                        style={{ width: 20, height: 12, borderRadius: 2 }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                    <span style={{ fontSize: 14, color: C.ink }}>{dial}</span>
                    {/* The phone's own list, over the code: a tap opens it. */}
                    <select
                      data-pw="demo-new-contact-dial"
                      aria-label={t("Country code")}
                      value={dial}
                      onChange={(e) => setDial(e.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    >
                      {allCountries.map((c) => (
                        <option key={`${c.iso2}-${c.dialCode}`} value={`+${c.dialCode}`}>
                          +{c.dialCode} ({getLocalizedCountryName(c.iso2, language)})
                        </option>
                      ))}
                    </select>
                  </span>
                  <FieldInput
                    testId="demo-new-contact-phone"
                    value={phone}
                    placeholder={t("Enter phone number")}
                    onChange={setPhone}
                    editing
                    type="tel"
                    inputMode="tel"
                  />
                </span>
              </Field>
              {/* The forms' wide button, in the flow of the sheet. */}
              <motion.button
                type="button"
                data-pw="demo-new-contact-save"
                aria-disabled={!canSave}
                onClick={save}
                animate={{ opacity: canSave ? 1 : 0.4 }}
                whileTap={canSave ? { scale: 0.98 } : undefined}
                className="shrink-0 font-normal cursor-pointer"
                style={{
                  marginTop: 24,
                  marginInlineStart: CTA.x,
                  width: fill(CTA.x),
                  height: CTA.height,
                  borderRadius: CTA.radius,
                  background: C.purple,
                  color: C.white,
                  fontSize: 16,
                }}
              >
                {t("Add & save")}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="flex flex-col w-full shrink-0"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24, transition: { duration: 0.12 } }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Row testId="demo-new-chat-add" first onClick={() => setAdding(true)}>
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{
                    marginInlineStart: 8,
                    width: 44,
                    height: 44,
                    borderRadius: 15,
                    background: C.purpleTint,
                  }}
                >
                  <PlusIcon color={C.purple} size={22} />
                </span>
                <Txt size={14} weight="medium" color={C.purple} ml={12}>
                  {t("New contact")}
                </Txt>
              </Row>
              {onSync && (
                <Row
                  testId="demo-new-chat-sync"
                  onClick={() => {
                    if (syncing) return;
                    setSyncing(true);
                    void onSync().finally(() => setSyncing(false));
                  }}
                >
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{ marginInlineStart: 8, width: 44, height: 44, borderRadius: 15, background: C.purpleTint }}
                  >
                    <PlusIcon color={C.purple} size={22} />
                  </span>
                  <Txt size={14} weight="medium" color={C.purple} ml={12}>
                    {translateFunction(syncing ? "Syncing..." : "Get from your contacts")}
                  </Txt>
                </Row>
              )}
              {contacts.map((contact) => (
                <Row
                  key={contact.id}
                  testId={`demo-new-chat-contact-${contact.id}`}
                  onClick={() => onPick(contact.id)}
                >
                  <span
                    className="relative block shrink-0 overflow-hidden flex-col"
                    style={{
                      marginInlineStart: 8,
                      width: 44,
                      height: 44,
                      borderRadius: 15,
                      background: contact.photo ? undefined : C.field,
                    }}
                  >
                    {contact.photo ? (
                      <img
                        src={contact.photo}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <Txt center size={12} weight="medium" mt={textTop(27, 12)}>
                        {contact.initials}
                      </Txt>
                    )}
                    <Stroke color={C.line} width={0.3} radius={15} />
                  </span>
                  <span className="flex flex-col min-w-0 grow" style={{ marginInlineStart: 12, marginInlineEnd: 12 }}>
                    <Txt size={14} weight="medium" className="overflow-hidden whitespace-nowrap" style={{ textOverflow: "ellipsis" }}>
                      {contact.name}
                    </Txt>
                    <Txt size={12} color={C.grey}>
                      <bdi dir="ltr">{contact.phone}</bdi>
                    </Txt>
                  </span>
                </Row>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Under>
    </Sheet>
  );
}

/** One 60 px row on the card, as the "Forward to" sheet draws them. */
function Row({
  testId,
  first = false,
  onClick,
  children,
}: {
  testId: string;
  first?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      data-pw={testId}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="flex items-center shrink-0 cursor-pointer text-start"
      style={{
        marginTop: first ? 16 : 2,
        marginInlineStart: ROW.x,
        width: fill(ROW.x),
        height: 60,
        borderRadius: ROW.radius,
        background: C.card,
      }}
    >
      {children}
    </motion.button>
  );
}
