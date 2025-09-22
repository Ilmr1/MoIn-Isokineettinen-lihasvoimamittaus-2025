import { batch, createSignal, ErrorBoundary, mergeProps } from "solid-js";
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

  const sizes = mergeProps({
    width: width - paddingLeft - paddingRight,
    height: height - paddingTop - paddingBottom,
    x: paddingLeft,
    y: paddingTop,
  }, props);


  // const chartValues = mergeProps({
  //   maxValue,
  //   minValue,
  //   startIndex,
  //   endIndex,
  //   points,
  //   splits,
  // }, props);

  const controls = mergeProps({ mouseX, mouseY }, props);

  const clearHoverCoors = () => batch(() => {
    setMouseX(-1);
    setMouseY(-1);
  });

  console.log("logs", props.parsedCTM);

  return (
    <>
      <SVGChartContext.Provider value={{ parsedCTM: () => props.parsedCTM, splitData: () => props.parsedCTM.powerSplit, min: () => props.parsedCTM.minmax.minPower, max: () => props.parsedCTM.minmax.maxPower, dataIndex: () => 0, mouseX, mouseY }}>
        <svg class="cp-chart" width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
          <ChartWrapper
            title="Torque"
            points={props.parsedCTM.pointCollections.power.points}
            maxValue={props.parsedCTM.pointCollections.power.maxValue}
            minValue={props.parsedCTM.pointCollections.power.minValue}
            splits={props.parsedCTM.splitCollections.power.splits}
            startIndex={props.parsedCTM.splitCollections.power.startIndex}
            endIndex={props.parsedCTM.splitCollections.power.endIndex}
            {...sizes}
            {...controls}
          />
        </svg>
      </SVGChartContext.Provider>
      <SVGChartContext.Provider value={{ parsedCTM: () => props.parsedCTM, splitData: () => props.parsedCTM.speedSplit, min: () => props.parsedCTM.minmax.minSpeed, max: () => props.parsedCTM.minmax.maxSpeed, dataIndex: () => 1, mouseX, mouseY }}>
        <svg class="cp-chart" width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
          <ChartWrapper
            title="Speed"
            points={props.parsedCTM.pointCollections.speed.points}
            maxValue={props.parsedCTM.pointCollections.speed.maxValue}
            minValue={props.parsedCTM.pointCollections.speed.minValue}
            splits={props.parsedCTM.splitCollections.speed.splits}
            startIndex={props.parsedCTM.splitCollections.speed.startIndex}
            endIndex={props.parsedCTM.splitCollections.speed.endIndex}
            {...sizes}
            {...controls}
          />
        </svg>
      </SVGChartContext.Provider>
      <SVGChartContext.Provider value={{ parsedCTM: () => props.parsedCTM, splitData: () => props.parsedCTM.angleSplit, min: () => props.parsedCTM.minmax.minAngle, max: () => props.parsedCTM.minmax.maxAngle, dataIndex: () => 2, mouseX, mouseY }}>
        <svg class="cp-chart" width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
          <ChartWrapper
            title="Angle"
            points={props.parsedCTM.pointCollections.angle.points}
            maxValue={props.parsedCTM.pointCollections.angle.maxValue}
            minValue={props.parsedCTM.pointCollections.angle.minValue}
            splits={props.parsedCTM.splitCollections.angle.splits}
            startIndex={props.parsedCTM.splitCollections.angle.startIndex}
            endIndex={props.parsedCTM.splitCollections.angle.endIndex}
            {...sizes}
            {...controls}
          />
        </svg>
      </SVGChartContext.Provider>
    </>
  );
}
