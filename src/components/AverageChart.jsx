import { batch, createSignal, ErrorBoundary, mergeProps } from "solid-js";
import { SVGChartContext } from "../providers";
import { ChartWrapper, ChartWrapperWithPadding } from "./GenericSVGChart.jsx";
import "./GenericSVGChart.css";
export function AverageChart(props) {

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

  const controls = mergeProps({ mouseX, mouseY }, props);

  const clearHoverCoors = () => batch(() => {
    setMouseX(-1);
    setMouseY(-1);
  });
  return (
    <Show when={props.listOfParsedCTM()?.length}>
      <svg class="cp-chart" width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
        <For each={props.listOfParsedCTM()}>{parsedData => (
          <ChartWrapperWithPadding
            title="Ext average"
            points={parsedData.rawObject.pointCollections.averagePowerExt.points}
            maxValue={parsedData.rawObject.pointCollections.averagePowerExt.maxValue}
            minValue={parsedData.rawObject.pointCollections.averagePowerExt.minValue}
            splits={parsedData.rawObject.splitCollections.averagePowerExt.splits}
            startIndex={parsedData.rawObject.splitCollections.averagePowerExt.startIndex}
            endIndex={parsedData.rawObject.splitCollections.averagePowerExt.endIndex}
            {...sizes}
            {...controls}
          />
        )}</For>
      </svg>
      <svg class="cp-chart" width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
        <For each={props.listOfParsedCTM()}>{parsedData => (
          <ChartWrapperWithPadding
            title="Flex average"
            points={parsedData.rawObject.pointCollections.averagePowerFlex.points}
            maxValue={parsedData.rawObject.pointCollections.averagePowerFlex.maxValue}
            minValue={parsedData.rawObject.pointCollections.averagePowerFlex.minValue}
            splits={parsedData.rawObject.splitCollections.averagePowerFlex.splits}
            startIndex={parsedData.rawObject.splitCollections.averagePowerFlex.startIndex}
            endIndex={parsedData.rawObject.splitCollections.averagePowerFlex.endIndex}
            {...sizes}
            {...controls}
          />
        )}</For>
      </svg>
    </Show>
  );
}
