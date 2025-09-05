import { createContext, useContext } from "solid-js";

export const SVGChartContext = createContext();
export const useSVGChartContext = () => useContext(SVGChartContext);
