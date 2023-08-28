import { combineReducers } from "redux";
import  HomeReducer  from "./homepage/reducer";
import AuthReducer from "./auth/reducer";
const rootReducer = combineReducers({
  homepage:HomeReducer,
  auth:AuthReducer

});

export default rootReducer;
