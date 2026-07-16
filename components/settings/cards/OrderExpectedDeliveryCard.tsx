import { useAppStore } from "store";
import { translateFunction } from "utils/functions";

type OrderExpectedDeliveryCardProps = {
  status?: string;
  time?: string;
  productsShippingDays?: Array<number | string | null | undefined>;
};

const getSafeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/**
 * Shared expected-delivery computation used by this card and by the inline
 * order-details summary — keep the two callers on this single source so the
 * date math can't drift apart.
 */
export const getExpectedDelivery = ({
  productsShippingDays = [],
  time,
  shippingDurationDays,
}: {
  productsShippingDays?: Array<number | string | null | undefined>;
  time?: string;
  shippingDurationDays?: unknown;
}) => {
  const maxProductShippingDays = productsShippingDays.reduce(
    (maxDays, currentDay) =>
      Math.max(Number(maxDays), getSafeNumber(currentDay)),
    0,
  );

  const expectedWorkDays =
    Number(maxProductShippingDays) + getSafeNumber(shippingDurationDays);

  const baseDate = time ? new Date(time) : new Date();
  const safeBaseDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
  const expectedDate = new Date(
    safeBaseDate.getTime() + expectedWorkDays * 24 * 60 * 60 * 1000,
  );

  return { expectedWorkDays, expectedDate };
};

function OrderExpectedDeliveryCard({
  status,
  time,
  productsShippingDays = [],
}: OrderExpectedDeliveryCardProps) {
  const { language, settings } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  const locale = language || "en-US";

  const { expectedWorkDays, expectedDate } = getExpectedDelivery({
    productsShippingDays,
    time,
    shippingDurationDays: settings?.["starting_setting"]?.shipping_duration_days,
  });

  const expectedWeekDay = expectedDate.toLocaleDateString(locale, {
    weekday: "long",
  });
  const expectedDayMonth = expectedDate.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });

  return (
    <div
      style={{
        direction: isRtl ? "rtl" : "ltr",
      }}
      className={`${
        status === "canceled" && "opacity-55"
      } bg-[#F4F4F4] relative w-1/2 min-h-[74px] h-auto  rounded-[15px] py-[8px] px-[12px] flex-col`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="20"
        height="20"
        viewBox="0 0 20 20"
      >
        <defs>
          <clipPath id="clip-path734">
            <rect
              id="Rectangle_4612"
              data-name="Rectangle 4612"
              width="20"
              height="20"
              transform="translate(0.223)"
              fill="none"
            />
          </clipPath>
        </defs>
        <g
          id="Group_13617"
          data-name="Group 13617"
          transform="translate(-0.223)"
        >
          <g
            id="Mask_Group_380"
            data-name="Mask Group 380"
            transform="translate(0)"
            clipPath="url(#clip-path734)"
          >
            <g id="delivery_location" transform="translate(1.792 -0.04)">
              <g id="Group_11335" data-name="Group 11335">
                <g
                  id="Group_11333"
                  data-name="Group 11333"
                  transform="translate(0 5.333)"
                >
                  <path
                    id="Path_21554"
                    data-name="Path 21554"
                    d="M14.014,16.2H7.307a.242.242,0,0,1-.242-.259.252.252,0,0,1,.242-.259h6.707a2.283,2.283,0,0,0,2.343-2.343,2.278,2.278,0,0,0-.582-1.438,2.317,2.317,0,0,0-1.762-.76H9.8a2.747,2.747,0,1,1,0-5.495h3.442a.242.242,0,0,1,.242.259.23.23,0,0,1-.259.226H9.8a2.255,2.255,0,0,0,0,4.509h4.218a2.781,2.781,0,0,1,2.844,2.683A2.816,2.816,0,0,1,14.014,16.2Z"
                    transform="translate(-1.602 -5.645)"
                    fill="#8d8d8d"
                  />
                  <g
                    id="Group_11332"
                    data-name="Group 11332"
                    transform="translate(0 7.014)"
                  >
                    <ellipse
                      id="Ellipse_269"
                      data-name="Ellipse 269"
                      cx="1.083"
                      cy="1.099"
                      rx="1.083"
                      ry="1.099"
                      transform="translate(1.891 1.875)"
                      fill="#8d8d8d"
                    />
                    <path
                      id="Path_21555"
                      data-name="Path 21555"
                      d="M4.587,12.645a2.939,2.939,0,0,0-2.974,2.893,2.738,2.738,0,0,0,.566,1.681v.016L4.36,20.241a.253.253,0,0,0,.194.1.23.23,0,0,0,.194-.1l2.214-3.006a.016.016,0,0,1,.016-.016,2.807,2.807,0,0,0,.566-1.681A2.915,2.915,0,0,0,4.587,12.645Zm0,4.558A1.6,1.6,0,1,1,6.17,15.6,1.59,1.59,0,0,1,4.587,17.2Z"
                      transform="translate(-1.613 -12.645)"
                      fill="#8d8d8d"
                    />
                  </g>
                </g>
                <g
                  id="Group_11334"
                  data-name="Group 11334"
                  transform="translate(10.731)"
                >
                  <path
                    id="Path_21556"
                    data-name="Path 21556"
                    d="M12.323,3.636h6.723L15.684.323Z"
                    transform="translate(-12.323 -0.323)"
                    fill="#8d8d8d"
                  />
                  <path
                    id="Path_21557"
                    data-name="Path 21557"
                    d="M12.984,8.4H14.5v-2a.252.252,0,0,1,.242-.259H16.62a.242.242,0,0,1,.242.259v2h1.519V4.129h-5.4Z"
                    transform="translate(-12.321 -0.315)"
                    fill="#8d8d8d"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="absolute top-[8px] right-[12px]"
      >
        <g id="Group_13618" data-name="Group 13618" transform="translate(0 0)">
          <path
            id="refund"
            d="M2.628,6.541c.287-.327.556-1.242,1.112-.919.44.434-.33.9-.483,1.31a.371.371,0,1,1-.629-.391ZM1.67,8.98c.194-.393.216-1.343.837-1.175a.372.372,0,0,1,.2.486c-.246.364-.182,1.262-.788,1.152A.371.371,0,0,1,1.67,8.98Zm-.294,2.6c.086-.429-.139-1.357.5-1.353a.371.371,0,0,1,.317.418c-.144.416.15,1.246-.451,1.318a.371.371,0,0,1-.37-.383Zm.388,2.591c-.028-.44-.484-1.271.138-1.437.618,0,.4.864.583,1.269a.37.37,0,0,1-.721.168Zm1.371,2.6c-.484-.075-.549-.775-.767-1.136a.37.37,0,1,1,.686-.281C3.163,15.786,3.932,16.631,3.135,16.775Zm1.844,1.347a.374.374,0,0,1-.271.625c-.43-.084-.651-.616-.939-.912a.371.371,0,1,1,.59-.448,9.3,9.3,0,0,0,.619.735Zm1.758,2.121a3.521,3.521,0,0,1-1.046-.649.372.372,0,0,1-.065-.521c.434-.44.9.33,1.307.484a.373.373,0,0,1-.2.686Zm2.347.919c-.387-.133-1.493-.274-1.281-.855.305-.538.95.086,1.388.128a.373.373,0,0,1-.107.726ZM21.376,11.4A10.328,10.328,0,0,1,11,21.4a.371.371,0,0,1,0-.742A9.577,9.577,0,0,0,20.635,11.4,9.232,9.232,0,0,0,5.123,4.613H6.59a.371.371,0,0,1,0,.742H4.242a.384.384,0,0,1-.37-.394V2.753a.37.37,0,1,1,.741,0V4.076A9.972,9.972,0,0,1,21.376,11.4Z"
            transform="translate(-1.376 -1.403)"
            fill="#26c13f"
          />
          <g id="box" transform="translate(5.889 5.395)">
            <path
              id="Path_22820"
              data-name="Path 22820"
              d="M9.11,1.071H2.862a.987.987,0,0,0-.987.987V9.293a.987.987,0,0,0,.987.987H9.11a.987.987,0,0,0,.987-.987V2.058A.987.987,0,0,0,9.11,1.071Zm.658,8.222a.658.658,0,0,1-.658.658H2.862A.658.658,0,0,1,2.2,9.293V2.058A.658.658,0,0,1,2.862,1.4H4.506V3.913a.5.5,0,0,0,.714.442l.694-.347a.166.166,0,0,1,.145,0l.694.344a.492.492,0,0,0,.714-.441V1.4H9.11a.658.658,0,0,1,.658.658Z"
              transform="translate(-1.875 -1.071)"
              fill="#1d1d1d"
            />
            <path
              id="Path_22821"
              data-name="Path 22821"
              d="M6.484,10.446H4.511a.5.5,0,0,0-.493.493v1.538a.494.494,0,0,0,.493.493H6.484a.494.494,0,0,0,.493-.493V10.94A.5.5,0,0,0,6.484,10.446ZM4.676,12.038a.164.164,0,0,1,.164-.164H6.156a.164.164,0,1,1,0,.329H4.84A.165.165,0,0,1,4.676,12.038Zm1.48-.493H4.84a.164.164,0,1,1,0-.329H6.156a.164.164,0,1,1,0,.329Z"
              transform="translate(-2.702 -4.691)"
              fill="#1d1d1d"
            />
            <path
              id="Path_22822"
              data-name="Path 22822"
              d="M11.605,14.023H9.779a.164.164,0,1,0,0,.329h1.826a.164.164,0,1,0,0-.329Z"
              transform="translate(-4.863 -6.072)"
              fill="#1d1d1d"
            />
            <path
              id="Path_22823"
              data-name="Path 22823"
              d="M11.926,12.77H10.611a.164.164,0,1,0,0,.329h1.316a.164.164,0,1,0,0-.329Z"
              transform="translate(-5.184 -5.588)"
              fill="#1d1d1d"
            />
          </g>
        </g>
      </svg>

      {status !== "canceled" && (
        <>
          <span className="text-[#8D8D8D] regular text-[10px] mt-[5px]">
            {translateFunction("Expected Delivery Date")}
          </span>
          <span
            style={{
              direction: isRtl ? "rtl" : "ltr",
            }}
            className="text-[#1D1D1D] flex flex-row text-[12px] regular mt-[3px] gap-[3px]"
          >
            <span>{expectedWeekDay}</span>
            <span className="bold text-[#1D1D1D] text-[12px]  mx-px">
              {expectedDayMonth}
            </span>
            <span>
              | {expectedWorkDays} {translateFunction("Work Days")}
            </span>
          </span>
        </>
      )}
    </div>
  );
}

export default OrderExpectedDeliveryCard;
