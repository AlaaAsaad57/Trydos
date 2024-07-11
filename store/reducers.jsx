import { combineReducers } from "redux";
import HomeReducer from "./homepage/reducer";
import ListingReducer from "./listing/reducer";
import SearchReducer from "./search/reducer";
import AuthReducer from "./auth/reducer";
import { ChatReducer } from "./chat/reducer";
import { CartReducer } from "./Cart/reducer";
import DetailsReducer from "./details/reducer";
const rootReducer = combineReducers({
  homepage: HomeReducer,
  auth: AuthReducer,
  chat: ChatReducer,
  listing: ListingReducer,
  Search: SearchReducer,
  details: DetailsReducer,
  cart: CartReducer,
});

export default rootReducer;
