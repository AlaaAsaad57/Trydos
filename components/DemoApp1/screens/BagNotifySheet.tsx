"use client";

import { useNotifyWhenAvailable } from "components/Cart/useNotifyWhenAvailable";
import AskSheet from "./AskSheet";

/**
 * The bag's "Notify Me" question (Stage 7d, S7d-11): the old prompt
 * (NotifyWhenAvailableModal) in the new design's style, with the same logic
 * (useNotifyWhenAvailable). It opens when the core backend refuses to raise a
 * line, almost always because the stock ran out.
 *
 *  - Not asked yet: "Notify Me", or "Cancel" under it.
 *  - Already asked (the backend's list says so): only "Close".
 *  - While the settings are read, "Notify Me" waits in grey.
 */
export default function BagNotifySheet({
  line,
  translate,
  onClose,
}: {
  line: any;
  translate: (key: string) => string;
  onClose: () => void;
}) {
  const { alreadySubscribed, loading, readingSettings, subscribe } =
    useNotifyWhenAvailable(line, translate);
  return (
    <AskSheet
      open
      testId="notify-when-available-modal"
      title={translate("We Could Not Add More Of This Product")}
      text={
        alreadySubscribed
          ? translate("You will be notified for this product already")
          : translate("Do You Want Us To Notify You When It Is Available?")
      }
      main={
        alreadySubscribed
          ? { label: translate("Close"), onPress: onClose, testId: "notify-modal-close" }
          : {
              label: translate("Notify Me"),
              onPress: () => void subscribe(),
              busy: loading,
              disabled: readingSettings,
              testId: "notify-modal-notify",
            }
      }
      other={
        alreadySubscribed
          ? undefined
          : { label: translate("Cancel"), onPress: onClose, testId: "notify-modal-cancel" }
      }
      onClose={onClose}
    />
  );
}
