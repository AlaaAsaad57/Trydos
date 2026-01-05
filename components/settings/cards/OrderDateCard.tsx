import { translateFunction } from "utils/functions";

const OrderDateCard = ({ time }) => {
  // Format the date string to a more readable format
  const formatTime = (timeString: string) => {
    const date = new Date(timeString + "Z");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const timeFormat = `${hours}:${minutes}:${seconds}`;

    if (date.toDateString() === today.toDateString()) {
      return `Today | ${timeFormat}`;
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday | ${timeFormat}`;
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year} | ${timeFormat}`;
  };

  return (
    <div className="bg-[#F4F4F4] ml-[8px] w-1/3 min-h-[74px] h-auto  rounded-[15px] py-[8px] px-[12px] flex-col">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 15 15"
      >
        <g
          id="Group_13616"
          data-name="Group 13616"
          transform="translate(-30 -116)"
        >
          <g id="deadline" transform="translate(30.636 116)">
            <path
              id="Path_22971"
              data-name="Path 22971"
              d="M11.42,5.094a2,2,0,0,0,.311-1.324.778.778,0,0,0-.4-.5.7.7,0,0,0-.556-.052,1.415,1.415,0,0,0-.73.813,5.917,5.917,0,0,0-3.2-.77l-.083-.8c.1-.019.2-.04.319-.059A4.4,4.4,0,0,0,8.45,2a1.115,1.115,0,0,0,.216-.162.761.761,0,0,0,.243-.656A1.084,1.084,0,0,0,8.37.4,2.041,2.041,0,0,0,6.962.31L4.532.785C4.471.8,4.4.809,4.333.824,3.591.957,2.352,1.18,2.481,2.3a.873.873,0,0,0,.376.654,1.159,1.159,0,0,0,.644.169,2.565,2.565,0,0,0,.7-.112c.271-.081.544-.143.825-.2l.155.768a5.936,5.936,0,0,0-2.465,1.6.252.252,0,0,0-.081-.093A2.306,2.306,0,0,0,1.43,4.749a.766.766,0,0,0-.72.366.624.624,0,0,0,.1.661,2.052,2.052,0,0,0,.758.449c.1.045.2.093.288.136a5.986,5.986,0,0,0,5.231,8.87,6.157,6.157,0,0,0,1.194-.119A5.99,5.99,0,0,0,11.42,5.094ZM10.925,3.66a.222.222,0,0,1,.19.024.3.3,0,0,1,.164.2,1.452,1.452,0,0,1-.209.873,5.753,5.753,0,0,0-.63-.485.143.143,0,0,0,.021-.031A1.057,1.057,0,0,1,10.925,3.66Zm-6.857-1.1a1.26,1.26,0,0,1-.958,0,.407.407,0,0,1-.169-.319c-.071-.628.625-.806,1.472-.958l.207-.038L7.05.769A3.224,3.224,0,0,1,7.642.7a1,1,0,0,1,.492.107.631.631,0,0,1,.311.433.3.3,0,0,1-.1.264.772.772,0,0,1-.133.1A4.049,4.049,0,0,1,7,1.941c-.162.029-.311.057-.437.086-.326.076-.663.138-.991.2a14.094,14.094,0,0,0-1.5.333Zm1.415.157.171-.031c.214-.04.43-.081.649-.126l.078.742c-.155.019-.309.043-.464.074-.1.019-.195.043-.29.067ZM1.763,5.8a2.886,2.886,0,0,1-.575-.3c-.055-.074-.076-.138-.057-.174s.131-.107.3-.107a1.861,1.861,0,0,1,.963.264A.174.174,0,0,0,2.44,5.5c-.119.15-.233.3-.338.464-.1-.05-.214-.1-.34-.159Zm6.429,8.854A5.52,5.52,0,1,1,6.011,3.831a5.575,5.575,0,0,1,1.1-.109A5.52,5.52,0,0,1,8.191,14.653Z"
              transform="translate(-0.655 -0.231)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22972"
              data-name="Path 22972"
              d="M7.416,3.813A.235.235,0,0,0,7.1,3.9L5.488,6.659a.851.851,0,0,0-.43-.024.882.882,0,0,0,.174,1.747.859.859,0,0,0,.174-.017A.882.882,0,0,0,6.1,7.327a.86.86,0,0,0-.214-.418L7.5,4.131a.235.235,0,0,0-.086-.319Zm-2.1,4.1a.416.416,0,1,1-.164-.815.492.492,0,0,1,.083-.007.415.415,0,0,1,.228.069.415.415,0,0,1-.147.754Z"
              transform="translate(1.193 1.544)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22973"
              data-name="Path 22973"
              d="M4.839,11.3A3.888,3.888,0,0,1,2.5,7.04,4.288,4.288,0,0,1,6.265,3.579a.233.233,0,0,0-.05-.464A4.755,4.755,0,0,0,2.043,6.957a4.387,4.387,0,0,0,2.589,4.762.232.232,0,0,0,.1.024.231.231,0,0,0,.1-.44Z"
              transform="translate(0.004 1.21)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22974"
              data-name="Path 22974"
              d="M9.209,5.14a4.783,4.783,0,0,0,.04,1.1,4.956,4.956,0,0,0,.133,1.094,3.064,3.064,0,0,0,.031-1.108A3.066,3.066,0,0,0,9.209,5.14Z"
              transform="translate(3.613 2.223)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22975"
              data-name="Path 22975"
              d="M9.882,6.459a2.968,2.968,0,0,0-.221-1.213,9.915,9.915,0,0,0,.055,1.217,10.435,10.435,0,0,0,.033,1.217A2.953,2.953,0,0,0,9.882,6.459Z"
              transform="translate(3.841 2.276)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22976"
              data-name="Path 22976"
              d="M1.23,8.776c-.045,0-.043.262.136.511s.423.335.44.295-.152-.176-.3-.392S1.278,8.769,1.23,8.776Z"
              transform="translate(-0.379 4.041)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22977"
              data-name="Path 22977"
              d="M.894,8.749a1.349,1.349,0,0,0,.152.92,1.339,1.339,0,0,0,.6.713c.033-.036-.247-.333-.452-.782S.944,8.747.894,8.749Z"
              transform="translate(-0.549 4.028)"
              fill="#8d8d8d"
            />
          </g>
          <rect
            id="Rectangle_6169"
            data-name="Rectangle 6169"
            width="15"
            height="15"
            transform="translate(30 116)"
            fill="none"
          />
        </g>
      </svg>
      <span className="text-[#8D8D8D] regular text-[10px] mt-[5px]">
        {translateFunction("Order Date")}
      </span>
      <span className="text-[#1D1D1D] text-[12px] regular mt-[3px]">
        {formatTime(time)}
      </span>
    </div>
  );
};

export default OrderDateCard;
