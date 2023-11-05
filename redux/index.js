import { combineReducers } from "redux";
import  HomeReducer  from "./homepage/reducer";
import AuthReducer from "./auth/reducer";
import {ChatReducer} from "./chat/reducer";
const rootReducer = combineReducers({
  homepage:HomeReducer,
  auth:AuthReducer,
  chat:ChatReducer,
});

export default rootReducer;
