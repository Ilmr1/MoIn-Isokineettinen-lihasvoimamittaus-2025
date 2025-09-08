import { batch, createSignal, ErrorBoundary } from "solid-js";
import { SVGChartContext } from "../providers";
import { ChartWrapper } from "./GenericSVGChart.jsx";
import "./GenericSVGChart.css";

export function ThreeCharts(props) {
  return (
    <ErrorBoundary fallback="Three chart rendering failed">
      <Chart {...props} />
    </ErrorBoundary>
  );
}

function Chart(props) {
  const [mouseX, setMouseX] = createSignal(-1);
  const [mouseY, setMouseY] = createSignal(-1);

  const width = 800;
  const height = 200;

  const paddingLeft = 100;
  const paddingRight = 10;
  const paddingTop = 18;
  const paddingBottom = 10;

  const updateHoverCoords = e => batch(() => {
    setMouseX(e.offsetX);
    setMouseY(e.offsetY);
  });

  const clearHoverCoors = () => batch(() => {
    setMouseX(-1);
    setMouseY(-1);
  });

  return (
    <>
      <SVGChartContext.Provider value={{ parsedCTM: () => props.parsedCTM, min: () => props.parsedCTM.minmax.minPower, max: () => props.parsedCTM.minmax.maxPower, dataIndex: () => 0, mouseX, mouseY }}>
        <svg class="cp-chart" width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
          <ChartWrapper title="Power" width={width - paddingLeft - paddingRight} height={height - paddingTop - paddingBottom} x={paddingLeft} y={paddingTop} />
        </svg>
      </SVGChartContext.Provider>
      <SVGChartContext.Provider value={{ parsedCTM: () => props.parsedCTM, min: () => props.parsedCTM.minmax.minSpeed, max: () => props.parsedCTM.minmax.maxSpeed, dataIndex: () => 1, mouseX, mouseY }}>
        <svg class="cp-chart" width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
          <ChartWrapper title="Speed" width={width - paddingLeft - paddingRight} height={height - paddingTop - paddingBottom} x={paddingLeft} y={paddingTop} />
        </svg>
      </SVGChartContext.Provider>
      <SVGChartContext.Provider value={{ parsedCTM: () => props.parsedCTM, min: () => props.parsedCTM.minmax.minAngle, max: () => props.parsedCTM.minmax.maxAngle, dataIndex: () => 2, mouseX, mouseY }}>
        <svg class="cp-chart" width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
          <ChartWrapper title="Angle" width={width - paddingLeft - paddingRight} height={height - paddingTop - paddingBottom} x={paddingLeft} y={paddingTop} />
        </svg>
      </SVGChartContext.Provider>
    </>
  );
}
