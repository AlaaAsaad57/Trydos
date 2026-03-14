"use client";

import { createContext, useContext } from "react";

export const ModalRouteContext = createContext<boolean>(false);

export const useIsModalRoute = (): boolean => useContext(ModalRouteContext);
