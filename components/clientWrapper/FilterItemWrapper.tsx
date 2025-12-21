"use client";
import auth from "services/auth";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { GAevent } from "utils/gtag";

function FilterItemWrapper({ item, children }) {
  const Send_Filter_Event = ({ type, value }) => {
    GAevent({
      action: GA_EVENT_NAMES.APPLY_FILTER,
      params: {
        user_id_custom: auth.UserID(),
        filter_type: type,
        filter_value: value,
      },
    });
  };
  const GtagEventHandler = () => {
    Send_Filter_Event({ type: item?.type, value: item?.value });
  };
  return (
    <div
      onClick={() => GtagEventHandler()}
      className="flex flex-row max-h-[92px]"
    >
      {children}
    </div>
  );
}

export default FilterItemWrapper;
