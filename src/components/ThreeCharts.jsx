import { batch, createSignal, ErrorBoundary, mergeProps, splitProps } from "solid-js";
import { ChartBorder, ChartGrid, ChartHeader, ChartHorizontalLineFromValue, ChartHorizontalPointLineWithLabel, ChartHorizontalSplitLineWithLabel, ChartHorizontalZeroLine, ChartMousePositionInPercentage, ChartPadding, ChartPath, ChartPercentageVerticalLine, ChartTextTop, ChartVecticalLinePercentageToRelativeIndex, ChartXAxisFloor, ChartYAxisFloor } from "./GenericSVGChart.jsx";
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

  const svgArea = { width: 800, height: 200, x: 0, y: 0 };

  const updateHoverCoords = e => batch(() => {
    setMouseX(e.offsetX);
    setMouseY(e.offsetY);
  });

  const controls = mergeProps({ mouseX, mouseY }, props);

  const clearHoverCoors = () => batch(() => {
    setMouseX(-1);
    setMouseY(-1);
  });

  return (
    <>
      <LineChartWithLabels
        {...props}
        title="Torque"
        points={props.parsedCTM.pointCollections.power.points}
        maxValue={props.parsedCTM.pointCollections.power.maxValue}
        minValue={props.parsedCTM.pointCollections.power.minValue}
        splits={props.parsedCTM.splitCollections.power.splits}
        startIndex={props.parsedCTM.splitCollections.power.startIndex}
        endIndex={props.parsedCTM.splitCollections.power.endIndex}
      />
      <LineChartWithLabels
        {...props}
        title="Speed"
        points={props.parsedCTM.pointCollections.speed.points}
        maxValue={props.parsedCTM.pointCollections.speed.maxValue}
        minValue={props.parsedCTM.pointCollections.speed.minValue}
        splits={props.parsedCTM.splitCollections.speed.splits}
        startIndex={props.parsedCTM.splitCollections.speed.startIndex}
        endIndex={props.parsedCTM.splitCollections.speed.endIndex}
      />
      <LineChartWithLabels
        {...props}
        title="Angle"
        points={props.parsedCTM.pointCollections.angle.points}
        maxValue={props.parsedCTM.pointCollections.angle.maxValue}
        minValue={props.parsedCTM.pointCollections.angle.minValue}
        splits={props.parsedCTM.splitCollections.angle.splits}
        startIndex={props.parsedCTM.splitCollections.angle.startIndex}
        endIndex={props.parsedCTM.splitCollections.angle.endIndex}
      />
      <CircleBar {...props} {...controls} />
    </>
  );

  function LineChartWithLabels(props) {
    return (
      <svg width={svgArea.width} height={svgArea.height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
        <ChartPadding name="border" {...svgArea} paddingLeft={80} paddingRight={50} paddingBottom={22} paddingTop={22}>{borderArea => (
          <>
            <ChartTextTop {...borderArea} title={props.title} />
            <ChartBorder {...borderArea} height={borderArea.height} />
            <ChartGrid {...borderArea} height={borderArea.height} />
            <ChartPadding name="lines" {...borderArea} padding={15}>{lineArea => (
              <>
                <ChartHorizontalZeroLine
                  {...lineArea}
                  x={borderArea.x}
                  width={borderArea.width}
                  maxValue={props.maxValue}
                  minValue={props.minValue}
                />
                <ChartXAxisFloor {...borderArea} startValue={props.startIndex / 256} endValue={props.endIndex / 256} x={lineArea.x} width={lineArea.width} />
                <ChartYAxisFloor {...borderArea} startValue={props.maxValue} endValue={props.minValue} y={lineArea.y} height={lineArea.height} />
                <g data-line>
                  <ChartPath
                    points={props.points}
                    maxValue={props.maxValue}
                    minValue={props.minValue}
                    splits={props.splits}
                    startIndex={props.startIndex}
                    endIndex={props.endIndex}
                    {...lineArea}
                    {...controls}
                  ></ChartPath>
                </g>
                <ChartMousePositionInPercentage {...controls} {...lineArea} y={borderArea.y} height={borderArea.height}>{mouseArea => (
                  <>
                    <ChartPercentageVerticalLine
                      {...mouseArea}
                      y={borderArea.y}
                      height={borderArea.height}
                    />
                    <ChartHorizontalPointLineWithLabel
                      {...props}
                      {...controls}
                      {...mouseArea}
                      {...lineArea}
                      x={borderArea.x}
                      width={borderArea.width}
                    />
                  </>
                )}</ChartMousePositionInPercentage>
              </>
            )}</ChartPadding>
          </>
        )}</ChartPadding>
      </svg>
    )
  }
}

function CircleBar(props) {
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

