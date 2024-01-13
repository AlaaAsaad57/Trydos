"use client";
import { createStore, applyMiddleware, compose } from 'redux';
import rootReducer from './reducers';
const middlewares = []
const composeEnhancers =typeof window !== "undefined"&& window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const index = createStore(rootReducer, undefined, composeEnhancers(applyMiddleware(...middlewares)));


const unsubscribe = index.subscribe(() => {
  
});
