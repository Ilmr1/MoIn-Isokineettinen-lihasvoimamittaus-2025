import { batch, createSignal, ErrorBoundary, mergeProps, splitProps } from "solid-js";
import { ChartBorder, ChartGrid, ChartHeader, ChartHorizontalSplitLineWithLabel, ChartMousePositionInPercentage, ChartPadding, ChartPath, ChartVecticalLinePercentageToRelativeIndex, ChartWrapper } from "./GenericSVGChart.jsx";
import "./GenericSVGChart.css";
import { asserts } from "../collections/collections.js";
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

  const controls = mergeProps({ mouseX, mouseY }, props);

  const clearHoverCoors = () => batch(() => {
    setMouseX(-1);
    setMouseY(-1);
  });

  console.log("logs", props.parsedCTM);

  return (
    <>
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
      <Test {...props} {...controls} />
    </>
  );
}

function Test(props) {
  asserts.assertTruthy(props.parsedCTM, "parsedCTM");

  const svgArea = { width: 800, height: 200, x: 0, y: 0 };
  const [controls] = splitProps(props, ["mouseX", "mouseY"]);

  return (
    <svg width={svgArea.width} height={svgArea.height}>
      <ChartPadding {...svgArea} paddingLeft={100} paddingTop={18} paddingRight={10} paddingBottom={1}>{chartArea => (
        <ChartMousePositionInPercentage {...controls} {...chartArea}>{mouseArea => (
          <>
            <ChartGrid {...chartArea} />
            <ChartBorder {...chartArea} />
            <ChartHeader {...chartArea} title="Torque repetitions" />
            <ChartPadding {...chartArea} paddingInline={25} paddingBlock={25}>{linesArea => (
              <For each={props.parsedCTM.splitCollections.power.splits}>{split => (
                <Show when={!split.disabled}>
                  <ChartPath
                    points={props.parsedCTM.pointCollections.power.points}
                    maxValue={props.parsedCTM.pointCollections.power.maxValue}
                    minValue={props.parsedCTM.pointCollections.power.minValue}
                    splits={[split]}
                    flipped={split.color === "blue"}
                    startIndex={split.startIndex}
                    endIndex={split.endIndex}
                    {...linesArea}
                    {...controls}
                  ></ChartPath>
                  <ChartHorizontalSplitLineWithLabel
                    points={props.parsedCTM.pointCollections.power.points}
                    maxValue={props.parsedCTM.pointCollections.power.maxValue}
                    minValue={props.parsedCTM.pointCollections.power.minValue}
                    split={split}
                    startIndex={props.parsedCTM.splitCollections.power.startIndex}
                    endIndex={props.parsedCTM.splitCollections.power.endIndex}
                    {...mouseArea}
                    {...linesArea}
                    x={chartArea.x}
                    width={chartArea.width}
                  />
                  <ChartVecticalLinePercentageToRelativeIndex
                    points={props.parsedCTM.pointCollections.power.points}
                    split={split}
                    flipped={split.color === "blue"}
                    startIndex={props.parsedCTM.splitCollections.power.startIndex}
                    endIndex={props.parsedCTM.splitCollections.power.endIndex}
                    {...mouseArea}
                    {...linesArea}
                  />
                </Show>
              )}</For>
            )}</ChartPadding>
          </>
        )}</ChartMousePositionInPercentage>
      )}</ChartPadding>
    </svg>
  )
}
