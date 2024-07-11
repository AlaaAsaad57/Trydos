"use client";
import { createStore, applyMiddleware, compose } from "redux";
import rootReducer from "store/reducers";
let Teststore;
function createTestStore() {
  const middlewares = [];
  const composeEnhancers = compose;

  const store = createStore(
    rootReducer,
    undefined,
    composeEnhancers(applyMiddleware(...middlewares))
  );

  return store;
}
Teststore = createTestStore();
export default Teststore;
