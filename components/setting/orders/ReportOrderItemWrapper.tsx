import React, { useEffect, useRef, useState } from "react";
import { LogError, translateFunction } from "utils/functions";
import { OrderInterface } from "utils/types/OrderInterface";
import Order from "services/order";
import Spinner from "components/global/Spinner";
import BottomSheet from "components/global/BottomSheet";
import {
  ORDER_REPORT_POINTS,
  ReportPointSelection,
} from "utils/orderReportOptions";
import {
  showErrorNotification,
  showSuccessNotification,
} from "store/notifications/reducer";

function ReportOrderItemWrapper({
  item,
  parentOrder,
  isRtl,
  backToMain,
  close,
  update,
}: {
  item: OrderInterface["details"][0];
  parentOrder: OrderInterface;
  isRtl: boolean;
  backToMain: () => void;
  close: () => void;
  update: () => Promise<any>;
}) {
  // selections: { [pointKey]: string[] }
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  // Optional single photo attached to the report (api-changelog §1). Held as a
  // raw File and sent multipart by the service; never gates submission.
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build a preview object-URL for the selected file and revoke it when the
  // file changes or the widget unmounts, so no blob leaks.
  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  // Mirror the backend rules so we fail fast without a wasted upload:
  // image mime jpeg/png/jpg/webp, max 4096 KB.
  const REPORT_IMAGE_MAX_KB = 4096;
  const REPORT_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
  ];

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!REPORT_IMAGE_TYPES.includes(file.type)) {
      showErrorNotification(
        translateFunction("Please choose a JPEG, PNG or WebP image"),
      );
      return;
    }
    if (file.size > REPORT_IMAGE_MAX_KB * 1024) {
      showErrorNotification(
        translateFunction("The photo must be 4 MB or less"),
      );
      return;
    }
    setImage(file);
  };

  const toggle = (pointKey: string, value: string) => {
    setSelections((prev) => {
      const current = prev[pointKey] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [pointKey]: next };
    });
  };

  const selectedCount = Object.values(selections).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
  const canSubmit = selectedCount > 0 || note.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || loading) return;
    const points: ReportPointSelection[] = ORDER_REPORT_POINTS.map((p) => ({
      point: p.key,
      values: selections[p.key] ?? [],
    })).filter((p) => p.values.length > 0); // omit empty points
    try {
      setLoading(true);
      await Order.ReportOrderItem({
        order_id: parentOrder.id,
        order_detail_id: item.id,
        product_id: item.product_id,
        order_group_id: parentOrder.order_group_id,
        points,
        note: note.trim(),
        image,
      });
      showSuccessNotification(
        translateFunction("We received your report. Thanks for your thoughts"),
      );
      await update();
      setLoading(false);
      // On success, close the whole order-item options sheet (not just back to
      // the options screen). Only on success — failures fall to catch below.
      close();
    } catch (error) {
      setLoading(false);
      showErrorNotification(
        translateFunction("Could not submit your report. Please try again"),
      );
      LogError({
        error,
        scenario: "Error In submit in ReportOrderItemWrapper",
      });
    }
  };

  return (
    // BottomSheet provides the draggable grabber (drag down to dismiss),
    // scrim-tap and Escape to close, plus the slide animation and scroll-lock.
    // onClose dismisses the whole widget.
    <BottomSheet isOpen={true} onClose={close} height={92}>
      <div
        className="flex-col w-full items-center px-[24px] pb-[24px]"
        style={{ direction: isRtl ? "rtl" : "ltr" }}
      >
        <span className="medium text-[14px] mt-[4px] text-[#1D1D1D]">
          {translateFunction("Report This Product")}
        </span>
        <span className="regular text-[12px] mt-[4px] text-[#8D8D8D] text-center">
          {translateFunction(
            "Tell us what went wrong so we can improve your experience",
          )}
        </span>
        <span className="border-[#C4C2C280] border-b w-full mt-[12px]" />

        {ORDER_REPORT_POINTS.map((point) => (
          <div key={point.key} className="flex-col w-full mt-[16px]">
            <span className="regular text-[12px] text-[#8D8D8D]">
              {translateFunction(point.titleLabel)}
            </span>
            <div className="flex-row w-full flex-wrap items-center mt-[10px] gap-y-[10px] gap-x-[12px]">
              {point.options.map((opt) => {
                const active = (selections[point.key] ?? []).includes(
                  opt.value,
                );
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggle(point.key, opt.value)}
                    className="px-[12px] w-auto cursor-pointer flex-row h-[39px] justify-center items-center rounded-[12px] bg-[#F8F8F8]"
                    style={{
                      flex: "0 1 auto",
                      border: active ? "1px solid #402CDD80" : "none",
                    }}
                  >
                    <span className="regular text-[12px] text-[#8D8D8D]">
                      {translateFunction(opt.label)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex-col w-full mt-[20px]">
          <span className="regular text-[12px] text-[#505050]">
            {translateFunction("Additional notes")}{" "}
            <span className="text-[#929191]">
              ({translateFunction("Optional")})
            </span>
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            dir={isRtl ? "rtl" : "ltr"}
            placeholder={translateFunction("Write more details here")}
            className="mt-[8px] w-full rounded-[15px] border border-[#E6E6E6] bg-white p-[12px] regular text-[12px] text-[#3c3c3c] outline-none resize-none"
          />
        </div>

        <div className="flex-col w-full mt-[20px]">
          <span className="regular text-[12px] text-[#505050]">
            {translateFunction("Add a photo")}{" "}
            <span className="text-[#929191]">
              ({translateFunction("Optional")})
            </span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handlePickImage}
            className="hidden"
          />
          {image && imagePreview ? (
            <div className="relative mt-[8px] w-[88px] h-[88px]">
              <img
                src={imagePreview}
                alt={translateFunction("Report photo")}
                className="w-full h-full rounded-[12px] object-cover"
              />
              <div
                onClick={() => setImage(null)}
                className="absolute top-[-6px] right-[-6px] z-40 w-[24px] h-[24px] cursor-pointer rounded-full bg-white text-red-500 light flex justify-center items-center hover:bg-red-100 shadow-[0_3px_6px_#0000006e]"
              >
                X
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-[8px] flex-col items-center justify-center gap-[4px] w-full h-[80px] rounded-[12px] bg-[#F8F8F8] border border-dashed border-[#402CDD80] cursor-pointer"
            >
              <span className="text-[#402CDD] text-[10px] regular">
                {translateFunction("Add Photo")}
              </span>
            </div>
          )}
        </div>

        <div
          onClick={submit}
          className={`${
            canSubmit ? "bg-[#402CDD]" : "bg-[#D3D3D3]"
          } rounded-[20px] text-white text-[14px] medium h-[50px] flex-row w-full items-center justify-center mt-[20px] cursor-pointer`}
        >
          {loading ? <Spinner /> : translateFunction("Submit Report")}
        </div>
        <div
          onClick={() => backToMain()}
          className="w-full h-[44px] items-center justify-center underline flex cursor-pointer text-[14px] text-[#8D8D8D] medium mt-[6px]"
        >
          {translateFunction("Cancel")}
        </div>
      </div>
    </BottomSheet>
  );
}

export default ReportOrderItemWrapper;
