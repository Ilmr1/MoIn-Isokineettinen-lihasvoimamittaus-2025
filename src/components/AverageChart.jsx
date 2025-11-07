import { batch, createMemo, createSignal, ErrorBoundary } from "solid-js";
import { ChartBorder, ChartErrorBands, ChartGridAlignedWithFloorXAxisLabels, ChartGridAlignedWithFloorYAxisLabels, ChartHorizontalPointLine, ChartHoverToolTip, ChartMousePositionInPercentage, ChartPadding, ChartPath, ChartPercentageVerticalLine, ChartTextBottom, ChartTextTop, ChartXAxisFloor, ChartYAxisFloor } from "./GenericSVGChart.jsx";
import "./GenericSVGChart.css";
import { arrayUtils } from "../utils/utils.js";
import { asserts } from "../collections/collections.js";
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

  const updateHoverCoords = e => batch(() => {
    setMouseX(e.offsetX);
    setMouseY(e.offsetY);
  });

  const clearHoverCoors = () => batch(() => {
    setMouseX(-1);
    setMouseY(-1);
  });

  const controls = { mouseX, mouseY };
  const svgArea = { width: 800, height: 250, x: 0, y: 0 };

  return (
    <Show when={props.listOfParsedCTM()?.length}>
      <AverageErrorChartForTorque type="Ext" {...props} />
      <AverageErrorChartForTorque type="Flex" {...props} />
    </Show>
  );

  function AverageErrorChartForTorque(props) {
    asserts.assertTypeFunction(props.listOfParsedCTM, "listOfParsedCTM");
    asserts.assertTruthy(props.type === "Ext" || props.type === "Flex", "Unkown type");

    const errorAverageKey = createMemo(() => `averagePower${props.type}Error`);
    const averageKey = createMemo(() => `averagePower${props.type}`);

    const combinedValues = createMemo(() => {
      const files = props.listOfParsedCTM();
      const type = props.type;
      const startAngles = [];
      const endAngles = [];
      for (const { rawObject } of files) {
        for (const split of rawObject.splitCollections.power.splits) {
          if (split.disabled) {
            continue;
          }
          if ((type === "Flex" && split.color === "blue") || (type === "Ext" && split.color === "red")) {
            startAngles.push(rawObject.pointCollections.angle.points[split.startIndex]);
            endAngles.push(rawObject.pointCollections.angle.points[split.endIndex]);
          }
        }
      }

      const xStartValue = arrayUtils.findByMaxDelta(startAngles, 0) || -1;
      const xEndValue = arrayUtils.findByMaxDelta(endAngles, 0) || 1;

      return {
        minValue: Math.min(...files.map(parsedData => parsedData.rawObject.pointCollections[errorAverageKey()].minValue)),
        maxValue: Math.max(...files.map(parsedData => parsedData.rawObject.pointCollections[errorAverageKey()].maxValue)),
        xStartValue,
        xEndValue,
      }
    });

    const colors = createMemo(() => props.listOfParsedCTM().map(file => file.baseColor));

    return (
      <svg width={svgArea.width} height={svgArea.height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
        <ChartPadding name="border" {...svgArea} paddingLeft={80} paddingRight={50} paddingBottom={40} paddingTop={22}>{borderArea => (
          <>
            <ChartTextTop {...borderArea} title={props.type + " average"} />
            <ChartBorder {...borderArea} />
            <ChartPadding name="lines" {...borderArea} padding={15}>{lineArea => (
              <>
                <ChartGridAlignedWithFloorXAxisLabels
                  startValue={combinedValues().xStartValue}
                  endValue={combinedValues().xEndValue}
                  {...lineArea}
                  y={borderArea.y}
                  height={borderArea.height}
                />
                <ChartGridAlignedWithFloorYAxisLabels
                  startValue={combinedValues().maxValue}
                  endValue={combinedValues().minValue}
                  {...lineArea}
                  x={borderArea.x}
                  width={borderArea.width}
                />
                <text x={borderArea.x + borderArea.width} y={borderArea.y} dominant-baseline="ideographic" text-anchor="end">Torque [Nm]</text>
                <ChartTextBottom {...borderArea} y={borderArea.y + borderArea.height + 20} title="Position [deg]" />
                <ChartXAxisFloor {...borderArea} startValue={combinedValues().xStartValue} endValue={combinedValues().xEndValue} x={lineArea.x} width={lineArea.width} />
                <ChartYAxisFloor {...borderArea} startValue={combinedValues().maxValue} endValue={combinedValues().minValue} y={lineArea.y} height={lineArea.height} />
                <Show when={props.errorBands}>
                  <g data-error-bands>
                    <For each={props.listOfParsedCTM()}>{parsedData => (
                      <ChartErrorBands
                        points={parsedData.rawObject.pointCollections[errorAverageKey()].points}
                        splits={parsedData.rawObject.splitCollections[averageKey()].splits}
                        startIndex={parsedData.rawObject.splitCollections[averageKey()].startIndex}
                        endIndex={parsedData.rawObject.splitCollections[averageKey()].endIndex}
                        fill={`color-mix(in oklab, ${parsedData.baseColor} 15%, transparent)`}
                        stroke={`color-mix(in oklab, ${parsedData.baseColor} 30%, transparent)`}
                        {...lineArea}
                        {...combinedValues()}
                      ></ChartErrorBands>
                    )}</For>
                  </g>
                </Show>
                <g data-lines>
                  <For each={props.listOfParsedCTM()}>{parsedData => (
                    <ChartPath
                      points={parsedData.rawObject.pointCollections[averageKey()].points}
                      splits={parsedData.rawObject.splitCollections[averageKey()].splits}
                      startIndex={parsedData.rawObject.splitCollections[averageKey()].startIndex}
                      endIndex={parsedData.rawObject.splitCollections[averageKey()].endIndex}
                      stroke={parsedData.baseColor}
                      {...lineArea}
                      {...combinedValues()}
                      {...controls}
                    ></ChartPath>
                  )}</For>
                </g>
                <ChartMousePositionInPercentage {...controls} {...borderArea} width={lineArea.width} x={lineArea.x}>{mouseArea => (
                  <>
                    <ChartPercentageVerticalLine {...mouseArea} y={borderArea.y} height={borderArea.height} />
                    <For each={props.listOfParsedCTM()}>{parsedData => (
                      <ChartHorizontalPointLine
                        points={parsedData.rawObject.pointCollections[averageKey()].points}
                        splits={parsedData.rawObject.splitCollections[averageKey()].splits}
                        startIndex={parsedData.rawObject.splitCollections[averageKey()].startIndex}
                        endIndex={parsedData.rawObject.splitCollections[averageKey()].endIndex}
                        {...combinedValues()}
                        {...mouseArea}
                        {...lineArea}
                        x={borderArea.x}
                        width={borderArea.width}
                      />
                    )}</For>
                    <ChartHoverToolTip
                      {...mouseArea}
                      {...lineArea}
                      x={borderArea.x}
                      listOfPoints={props.listOfParsedCTM().map(v => v.rawObject.pointCollections[averageKey()].points)}
                      listOfSplits={props.listOfParsedCTM().map(v => v.rawObject.splitCollections[averageKey()])}
                      maxValue={combinedValues().maxValue}
                      minValue={combinedValues().minValue}
                      colors={colors()}
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
