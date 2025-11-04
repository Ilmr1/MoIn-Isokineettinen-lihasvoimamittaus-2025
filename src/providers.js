import { createContext, useContext } from "solid-js";

export const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);
