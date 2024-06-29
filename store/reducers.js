import { combineReducers } from "redux";
import HomeReducer from "./homepage/reducer";
import ListingReducer from "./listing/reducer";
import SearchReducer from "./search/reducer";
import AuthReducer from "./auth/reducer";
import { ChatReducer } from "./chat/reducer";
const rootReducer = combineReducers({
  homepage: HomeReducer,
  auth: AuthReducer,
  chat: ChatReducer,
  listing: ListingReducer,
  Search: SearchReducer,
});

export default rootReducer;
