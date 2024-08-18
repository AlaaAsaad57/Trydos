"use client";
import { createStore, applyMiddleware, compose } from "redux";
import rootReducer from "./reducers";
import persistState from "redux-localstorage";
const middlewares = [];
const composeEnhancers =
  (typeof window !== "undefined" &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

export const store = createStore(
  rootReducer,
  undefined
  // composeEnhancers(persistState(["details"]))
);

const unsubscribe = store.subscribe(() => {});
