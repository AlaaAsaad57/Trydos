"use client";
import { createStore, applyMiddleware, compose } from "redux";
import rootReducer from "store/reducers";

export function createTestStore() {
  const middlewares = [];
  const composeEnhancers = compose;

  const store = createStore(
    rootReducer,
    undefined,
    composeEnhancers(applyMiddleware(...middlewares))
  );

  return store;
}
