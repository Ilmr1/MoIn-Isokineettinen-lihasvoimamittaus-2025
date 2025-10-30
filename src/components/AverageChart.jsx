import { batch, createMemo, createSignal, ErrorBoundary } from "solid-js";
import { ChartBorder, ChartBorderPadding, ChartErrorBands, ChartFooter, ChartGrid, ChartHeader, ChartHeaderPadding, ChartHorizontalPointLineWithLabel, ChartMousePositionInPercentage, ChartPadding, ChartPath, ChartPercentageVerticalLine, ChartTextTop, ChartXAxisCeil, ChartXAxisFloor, ChartYAxisFloor } from "./GenericSVGChart.jsx";
import "./GenericSVGChart.css";
import { arrayUtils, numberUtils } from "../utils/utils.js";
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
  const svgArea = { width: 800, height: 220, x: 0, y: 0 };

  const colors = ["oklch(70.4% 0.191 22.216)", "oklch(79.2% 0.209 151.711)", "oklch(62.3% 0.214 259.815)", "oklch(85.2% 0.199 91.936)"];
  const strokeColor = colors.map(color => `color-mix(in oklab, ${color} 50%, transparent)`);
  const fillColor = colors.map(color => `color-mix(in oklab, ${color} 15%, transparent)`);
  const getColorStyles = i => ({
    fill: arrayUtils.atWithWrapping(fillColor, i),
    stroke: arrayUtils.atWithWrapping(strokeColor, i),
  });

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
      const avgKey = averageKey();
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
        // startIndex: Math.min(...files.map(parsedData => parsedData.rawObject.splitCollections[avgKey].startIndex)),
        // endIndex: Math.max(...files.map(parsedData => parsedData.rawObject.splitCollections[avgKey].endIndex)),
      }
    });

    return (
      <svg width={svgArea.width} height={svgArea.height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
        <ChartPadding name="border" {...svgArea} paddingLeft={80} paddingRight={50} paddingBottom={22} paddingTop={22}>{borderArea => (
          <>
            <ChartTextTop {...borderArea} title={props.type + " average"} />
            <ChartBorder {...borderArea} height={borderArea.height} />
            <ChartGrid {...borderArea} height={borderArea.height} />
            <ChartPadding name="lines" {...borderArea} padding={15}>{lineArea => (
              <>
                <ChartXAxisFloor {...borderArea} startValue={combinedValues().xStartValue} endValue={combinedValues().xEndValue} x={lineArea.x} width={lineArea.width} />
                <ChartYAxisFloor {...borderArea} startValue={combinedValues().maxValue} endValue={combinedValues().minValue} y={lineArea.y} height={lineArea.height} />
                <g data-error-bands>
                  <For each={props.listOfParsedCTM()}>{(parsedData, i) => (
                    <ChartErrorBands
                      points={parsedData.rawObject.pointCollections[errorAverageKey()].points}
                      splits={parsedData.rawObject.splitCollections[averageKey()].splits}
                      startIndex={parsedData.rawObject.splitCollections[averageKey()].startIndex}
                      endIndex={parsedData.rawObject.splitCollections[averageKey()].endIndex}
                      {...lineArea}
                      {...getColorStyles(i())}
                      {...combinedValues()}
                    ></ChartErrorBands>
                  )}</For>
                </g>
                <g data-lines>
                  <For each={props.listOfParsedCTM()}>{(parsedData, i) => (
                    <ChartPath
                      points={parsedData.rawObject.pointCollections[averageKey()].points}
                      splits={parsedData.rawObject.splitCollections[averageKey()].splits}
                      startIndex={parsedData.rawObject.splitCollections[averageKey()].startIndex}
                      endIndex={parsedData.rawObject.splitCollections[averageKey()].endIndex}
                      stroke={arrayUtils.atWithWrapping(colors, i())}
                      {...lineArea}
                      {...combinedValues()}
                      {...controls}
                    ></ChartPath>
                  )}</For>
                </g>
                <ChartMousePositionInPercentage {...controls} {...lineArea} width={lineArea.width} x={lineArea.x}>{mouseArea => (
                  <>
                    <ChartPercentageVerticalLine {...mouseArea} y={borderArea.y} height={borderArea.height} />
                    <For each={props.listOfParsedCTM()}>{parsedData => (
                      <ChartHorizontalPointLineWithLabel
                        points={parsedData.rawObject.pointCollections[averageKey()].points}
                        splits={parsedData.rawObject.splitCollections[averageKey()].splits}
                        startIndex={parsedData.rawObject.splitCollections[averageKey()].startIndex}
                        endIndex={parsedData.rawObject.splitCollections[averageKey()].endIndex}
                        {...combinedValues()}
                        {...mouseArea}
                        x={borderArea.x}
                        width={borderArea.width}
                      />
                    )}</For>
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
