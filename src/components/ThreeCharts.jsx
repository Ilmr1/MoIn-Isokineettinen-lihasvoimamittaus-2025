import { batch, createSignal, ErrorBoundary, mergeProps, splitProps } from "solid-js";
import { ChartBorder, ChartGrid, ChartGridAlignedWithFloorXAxisLabels, ChartGridAlignedWithFloorYAxisLabels, ChartHorizontalPointLineWithLabel, ChartHorizontalSplitLineWithLabel, ChartHorizontalZeroLine, ChartMousePositionInPercentage, ChartPadding, ChartPath, ChartPercentageVerticalLine, ChartTextTop, ChartVecticalLinePercentageToRelativeIndex, ChartXAxisFloor, ChartYAxisFloor } from "./GenericSVGChart.jsx";
import "./GenericSVGChart.css";
import { asserts } from "../collections/collections.js";
import { $hoveredRepetition } from "../signals.js";
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
      <ChartPadding name="border" {...svgArea} paddingLeft={80} paddingRight={50} paddingBottom={22} paddingTop={22}>{borderArea => (
        <ChartPadding name="lines" {...borderArea} padding={15}>{lineArea => (
          <ChartMousePositionInPercentage {...controls} {...lineArea} y={borderArea.y} height={borderArea.height}>{mouseArea => (
            <>
              <LineChartWithLabels
                {...props}
                borderArea={borderArea}
                lineArea={lineArea}
                mouseArea={mouseArea}
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
                borderArea={borderArea}
                lineArea={lineArea}
                mouseArea={mouseArea}
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
                borderArea={borderArea}
                lineArea={lineArea}
                mouseArea={mouseArea}
                title="Angle"
                points={props.parsedCTM.pointCollections.angle.points}
                maxValue={props.parsedCTM.pointCollections.angle.maxValue}
                minValue={props.parsedCTM.pointCollections.angle.minValue}
                splits={props.parsedCTM.splitCollections.angle.splits}
                startIndex={props.parsedCTM.splitCollections.angle.startIndex}
                endIndex={props.parsedCTM.splitCollections.angle.endIndex}
              />
              <CircleBar
                {...props}
                {...controls}
                mouseArea={mouseArea}
                points={props.parsedCTM.pointCollections.power.points}
                splits={props.parsedCTM.splitCollections.power.splits}
                maxValue={props.parsedCTM.pointCollections.power.maxValue}
                minValue={props.parsedCTM.pointCollections.power.minValue}
                startIndex={props.parsedCTM.splitCollections.power.startIndex}
                endIndex={props.parsedCTM.splitCollections.power.endIndex}
              />
            </>
          )}</ChartMousePositionInPercentage>
        )}</ChartPadding>
      )}</ChartPadding>
    </>
  );

  function LineChartWithLabels(props) {
    return (
      <svg width={svgArea.width} height={svgArea.height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
        <ChartTextTop {...props.borderArea} title={props.title} />
        <ChartBorder {...props.borderArea} />
        <ChartGridAlignedWithFloorXAxisLabels
          startValue={props.startIndex / 256}
          endValue={props.endIndex / 256}
          {...props.lineArea}
          y={props.borderArea.y}
          height={props.borderArea.height}
        />
        <ChartGridAlignedWithFloorYAxisLabels
          startValue={props.maxValue}
          endValue={props.minValue}
          {...props.lineArea}
          x={props.borderArea.x}
          width={props.borderArea.width}
        />
        <ChartHorizontalZeroLine
          {...props.lineArea}
          x={props.borderArea.x}
          width={props.borderArea.width}
          maxValue={props.maxValue}
          minValue={props.minValue}
        />
        <ChartXAxisFloor {...props.borderArea} startValue={props.startIndex / 256} endValue={props.endIndex / 256} x={props.lineArea.x} width={props.lineArea.width} />
        <ChartYAxisFloor {...props.borderArea} startValue={props.maxValue} endValue={props.minValue} y={props.lineArea.y} height={props.lineArea.height} />
        <g data-line>
          <ChartPath
            points={props.points}
            maxValue={props.maxValue}
            minValue={props.minValue}
            splits={props.splits}
            startIndex={props.startIndex}
            endIndex={props.endIndex}
            {...props.lineArea}
            {...controls}
          ></ChartPath>
        </g>
        <ChartPercentageVerticalLine
          {...props.mouseArea}
          y={props.borderArea.y}
          height={props.borderArea.height}
        />
        <ChartHorizontalPointLineWithLabel
          {...props}
          {...controls}
          {...props.mouseArea}
          {...props.lineArea}
          x={props.borderArea.x}
          width={props.borderArea.width}
        />
      </svg>
    )
  }
}

function CircleBar(props) {
  asserts.assertTruthy(props.parsedCTM, "parsedCTM");

  const svgArea = { width: 500, height: 250, x: 0, y: 0 };

  const getStrokeColorIfHovered = (split, index) => {
    const repIndex = $hoveredRepetition.repetitionIndex;
    const fileIndex = $hoveredRepetition.fileIndex;

    if (repIndex == -1 || props.fileIndex != fileIndex) {
      return;
    }
    if (repIndex == index || repIndex + 1 == index) {
      return split.color;
    }
    return `color-mix(in hsl, ${split.color} 20%, transparent)`
  }

  return (
    <ErrorBoundary fallback="Circle chart error">
      <svg width={svgArea.width} height={svgArea.height}>
        <ChartPadding name="border" {...svgArea} paddingLeft={80} paddingRight={50} paddingBottom={22} paddingTop={22}>{borderArea => (
          <>
            <ChartGrid {...borderArea} />
            <ChartBorder {...borderArea} />
            <ChartTextTop {...borderArea} title="Torque repetitions" />
            <ChartPadding name="lines" {...borderArea} padding={15}>{lineArea => (
              <>
                <ChartHorizontalZeroLine
                  {...lineArea}
                  x={borderArea.x}
                  width={borderArea.width}
                  maxValue={props.maxValue}
                  minValue={props.minValue}
                />
                <ChartYAxisFloor {...borderArea} startValue={props.maxValue} endValue={props.minValue} y={lineArea.y} height={lineArea.height} />
                <For each={props.splits}>{(split, i) => (
                  <Show when={!split.disabled}>
                    <ChartPath
                      points={props.points}
                      maxValue={props.maxValue}
                      minValue={props.minValue}
                      splits={[split]}
                      flipped={split.color === "blue"}
                      startIndex={split.startIndex}
                      endIndex={split.endIndex}
                      stroke={getStrokeColorIfHovered(split, i())}
                      {...lineArea}
                    ></ChartPath>
                    <ChartHorizontalSplitLineWithLabel
                      points={props.points}
                      maxValue={props.maxValue}
                      minValue={props.minValue}
                      split={split}
                      startIndex={props.startIndex}
                      endIndex={props.endIndex}
                      {...props.mouseArea}
                      {...lineArea}
                      x={borderArea.x}
                      width={borderArea.width}
                    />
                    <ChartVecticalLinePercentageToRelativeIndex
                      points={props.parsedCTM.pointCollections.power.points}
                      split={split}
                      flipped={split.color === "blue"}
                      startIndex={props.startIndex}
                      endIndex={props.endIndex}
                      {...props.mouseArea}
                      {...lineArea}
                      y={borderArea.y}
                      height={borderArea.height}
                    />
                  </Show>
                )}</For>
              </>
            )}</ChartPadding>
          </>
        )}</ChartPadding>
      </svg>
    </ErrorBoundary>
  )
}

