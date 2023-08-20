import { combineReducers } from "redux";
import  HomeReducer  from "./homepage/reducer";
const rootReducer = combineReducers({
  homepage:HomeReducer

});

export default rootReducer;
