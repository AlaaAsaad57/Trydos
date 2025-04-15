import StoryServiceClass from "services/story";

import { v4 as uuidv4 } from "uuid";
const initialState = {
  language: "en",
  country: "",
  loading: false,
  loadingStories: true,
  selectedStory: null,
  renderStories: false,
  OpenCamera: false,
  storiesData: null,
  categories: [],

  settings: null,
  loginOpen: false,
  boutiques: [],
  categories: [],
  session_id: uuidv4(),
  previous_event_button_name: null,
  activeRoute: "/",
  showMessage: false,
  currency: null,
  countries: [],
  isRegisteringReady: true,
};
const storiesData = [
  {
    id: 232,
    mobile_phone: "+963956685405",
    photo_path: null,
    name: "Yael alan ن",
    username: null,
    original_user_id: 15162,
    email: null,
    stories: [
      {
        id: 319,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        storage_video_path: null,
        user_id: 232,
        is_photo: 0,
        is_video: 1,
        video_path:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        duration: 600000,
        product_id: null,
        file: null,
        is_seen: true,
        viewers_count: 1,
        media: [],
      },
      {
        id: 320,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 232,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1740505924/wlfytfhviuiyzc4mkjsr.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 354,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 232,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1744175045/fof5fimsnfoummfqdcan.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
    ],
    media: [],
  },
  {
    id: 5,
    mobile_phone: "+963997412860",
    photo_path: null,
    name: "alidaaaa",
    username: null,
    original_user_id: null,
    email: null,
    stories: [
      {
        id: 304,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 5,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1729419565/o0fzb9pwr4wcucxydvlv.jpg",
        product_id: null,
        file: null,
        is_seen: true,
        viewers_count: 3,
        media: [],
      },
    ],
    media: [],
  },
  {
    id: 48,
    mobile_phone: "+963980276738",
    photo_path: null,
    name: "731samar",
    username: null,
    original_user_id: 399,
    email: null,
    stories: [
      {
        id: 305,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 48,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1730797239/vxwsbyf3p5hcagec4nai.jpg",
        product_id: null,
        file: null,
        is_seen: true,
        viewers_count: 1,
        media: [],
      },
      {
        id: 306,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 48,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1730797257/efttmyefiambrdircujw.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
    ],
    media: [],
  },
  {
    id: 46,
    mobile_phone: "+963934330889",
    photo_path: null,
    name: "helal mohamad",
    username: null,
    original_user_id: 176,
    email: null,
    stories: [
      {
        id: 307,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 46,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1734546232/fmfsjbuurrfd29yqcqrw.jpg",
        product_id: null,
        file: null,
        is_seen: true,
        viewers_count: 8,
        media: [],
      },
      {
        id: 308,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 46,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1734547501/yygs02ctg9re7e0hsi8m.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
    ],
    media: [],
  },
  {
    id: 6,
    mobile_phone: "+963937288307",
    photo_path: null,
    name: "Alaa Asaad",
    username: null,
    original_user_id: null,
    email: null,
    stories: [
      {
        id: 309,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1737844625/1737844624.png",
        product_id: null,
        file: null,
        is_seen: true,
        viewers_count: 4,
        media: [],
      },
      {
        id: 316,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1739739626/1739739625.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 317,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1739739739/1739739738.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 318,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1739784373/1739784372.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 321,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1740610019/1740610019.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 322,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1740705012/1740705011.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 323,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1740813859/1740813859.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 324,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1740814830/1740814829.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 325,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1740826009/1740826009.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 326,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1740873218/1740873217.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 327,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1740912494/1740912493.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 328,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1740959616/1740959615.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 329,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1740999983/1740999982.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 330,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741032526/1741032525.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 331,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741044667/1741044667.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 332,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741085157/1741085156.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 333,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741085614/1741085613.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 334,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741131112/1741131111.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 335,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741197677/1741197676.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 336,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741201278/1741201277.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 337,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741212197/1741212196.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 338,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741456849/1741456848.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 339,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741536564/1741536563.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 340,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741538421/1741538420.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 341,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1741606060/1741606059.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 342,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1742146328/1742146327.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 343,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1742164339/1742164338.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 344,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1742366104/1742366103.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 345,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1742370940/1742370940.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 349,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1742733855/1742733854.webp",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
      {
        id: 350,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 6,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "http://res.cloudinary.com/djooohujg/image/upload/v1742734540/1742734539.webp",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
    ],
    media: [],
  },
  {
    id: 195,
    mobile_phone: "+963988199566",
    photo_path: null,
    name: "تيتينثننبمم",
    username: null,
    original_user_id: 12787,
    email: null,
    stories: [
      {
        id: 310,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 195,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1738695780/bvmie6iucjlqlythnybz.jpg",
        product_id: null,
        file: null,
        is_seen: true,
        viewers_count: 4,
        media: [],
      },
    ],
    media: [],
  },
  {
    id: 193,
    mobile_phone: "+963959983672",
    photo_path: null,
    name: "يزن الكعدي",
    username: null,
    original_user_id: 12774,
    email: null,
    stories: [
      {
        id: 311,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 193,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1738696082/jupl6nvtafvke7ygpuqt.jpg",
        product_id: null,
        file: null,
        is_seen: true,
        viewers_count: 8,
        media: [],
      },
      {
        id: 313,
        cut_video_name: null,
        cut_video_path: null,
        full_video_name: null,
        full_video_path: null,
        storage_video_path: null,
        user_id: 193,
        is_photo: 1,
        is_video: 0,
        photo_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1738698133/t5ucvdgreng63zkejtb4.jpg",
        product_id: null,
        file: null,
        is_seen: false,
        viewers_count: 0,
        media: [],
      },
    ],
    media: [],
  },
];
const HomeReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "OPEN_CAMERA": {
      return {
        ...state,
        OpenCamera: payload,
      };
    }
    case "IS-REGISTERING": {
      return {
        ...state,
        isRegisteringReady: payload,
      };
    }
    case "COUNTRIES-DATA": {
      return {
        ...state,
        countries: payload,
      };
    }
    case "CURRENCY": {
      return {
        ...state,
        currency: payload,
      };
    }
    case "ACTIVE-ROUTE": {
      return {
        ...state,
        activeRoute: payload,
      };
    }

    case "GA-EVENT": {
      return {
        ...state,
        previous_event_button_name: payload,
      };
    }
    case "LOGIN-OPEN": {
      if (payload) {
        document.documentElement.scrollTo({ top: 0 });
        document.documentElement.style.overflow = "hidden";
      } else {
        document.documentElement.scrollTo({ top: 0 });

        document.documentElement.style.overflow = "initial";
      }
      return {
        ...state,
        loginOpen: payload,
        showMessage: false,
      };
    }
    case "WATCH-STORY": {
      let arr = [];
      state.storiesData.map((story) => {
        if (story.id === payload.id) {
          let arrStories = [];
          story.stories.map((storyItem) => {
            if (storyItem.id === payload.pid) {
              arrStories.push({ ...storyItem, is_seen: true });
            } else {
              arrStories.push(storyItem);
            }
          });
          arr.push({ ...story, stories: arrStories });
        } else {
          arr.push(story);
        }
      });
      return {
        ...state,
        storiesData: arr,
      };
    }
    case "APP-LANGUAGE": {
      return { ...state, language: payload };
    }
    case "APP-COUNTRY": {
      return {
        ...state,
        country: payload,
      };
    }
    case "STORY-SELECTED": {
      return {
        ...state,
        selectedStory: payload,
        renderStories: !state.renderStories,
      };
    }
    case "STORY-DATA": {
      return { ...state, storiesData: storiesData, loadingStories: false };
    }
    case "NEXT-STORY": {
      let index;
      state.storiesData.map((story, i) => {
        if (story.id === payload) index = i;
      });
      if (index < state.storiesData.length - 1)
        return {
          ...state,
          selectedStory: StoryServiceClass.configureStory(
            state.storiesData.filter((story, i) => i === index + 1)[0]
          ),
          renderStories: !state.renderStories,
        };
      else return { ...state, selectedStory: null };
    }
    case "PREV-STORY": {
      let index;
      state.storiesData.map((story, i) => {
        if (story.id === payload) index = i;
      });
      if (index > 0)
        return {
          ...state,
          selectedStory: StoryServiceClass.configureStory(
            state.storiesData.filter((story, i) => i === index - 1)[0]
          ),
          renderStories: !state.renderStories,
        };
      else return { ...state, selectedStory: state.selectedStory };
    }
    case "ADD-STORY": {
      let arr = [];
      state.storiesData.map((storyItem) => {
        if (storyItem.id === payload.user_id) {
          arr.push({ ...storyItem, stories: [...storyItem.stories, payload] });
        } else {
          arr.push(storyItem);
        }
      });
      if (
        !state.storiesData.some(
          (user) => parseInt(user.id) === parseInt(payload.user_id)
        )
      ) {
        arr.push({ ...StoryServiceClass.getUserStories(), stories: [payload] });
      }
      return {
        ...state,
        storiesData: [
          arr.filter((storyUser) => storyUser.id === payload.user_id)[0],
          ...arr.filter((storyUser) => storyUser.id !== payload.user_id),
        ],
      };
    }

    case "GET_SETTINGS": {
      return {
        ...state,
        settings: payload.data,
      };
    }
    default:
      return state;
  }
};
export default HomeReducer;
