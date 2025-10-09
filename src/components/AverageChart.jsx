import { batch, createMemo, createSignal, ErrorBoundary } from "solid-js";
import { ChartBorder, ChartBorderPadding, ChartErrorBands, ChartFooter, ChartGrid, ChartHeader, ChartHeaderPadding, ChartHorizontalPointLineWithLabel, ChartMousePositionInPercentage, ChartPadding, ChartPath, ChartPercentageVerticalLine, ChartXAxis } from "./GenericSVGChart.jsx";
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
  const svgArea = { width: 800, height: 200, x: 0, y: 0 };

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

    const combinedValues = createMemo(() => ({
      minValue: Math.min(...props.listOfParsedCTM().map(parsedData => parsedData.rawObject.pointCollections[errorAverageKey()].minValue)),
      maxValue: Math.max(...props.listOfParsedCTM().map(parsedData => parsedData.rawObject.pointCollections[errorAverageKey()].maxValue)),
      // startIndex: Math.min(...props.listOfParsedCTM().map(parsedData => parsedData.rawObject.splitCollections[averageKey()].startIndex)),
      // endIndex: Math.max(...props.listOfParsedCTM().map(parsedData => parsedData.rawObject.splitCollections[averageKey()].endIndex)),
    }));

    return (
      <svg width={svgArea.width} height={svgArea.height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
        <ChartPadding {...svgArea} paddingLeft={80} paddingRight={25}>{chartArea => (
          <ChartHeaderPadding {...chartArea} title={props.type + " average"}>{chartArea => (
            <ChartXAxis paddingInline={15} startValue={4} endValue={86} gap={4} {...chartArea} >{linesArea => (
              <ChartPadding {...linesArea} paddingBlock={15}>{linesArea2 => (
                <>
                  <ChartBorder {...chartArea} height={linesArea.height} />
                  <ChartGrid {...chartArea} height={linesArea.height} />
                  <For each={props.listOfParsedCTM()}>{(parsedData, i) => (
                    <ChartErrorBands
                      points={parsedData.rawObject.pointCollections[errorAverageKey()].points}
                      splits={parsedData.rawObject.splitCollections[averageKey()].splits}
                      startIndex={parsedData.rawObject.splitCollections[averageKey()].startIndex}
                      endIndex={parsedData.rawObject.splitCollections[averageKey()].endIndex}
                      {...getColorStyles(i())}
                      {...linesArea2}
                      {...combinedValues()}
                    ></ChartErrorBands>
                  )}</For>
                  <For each={props.listOfParsedCTM()}>{(parsedData, i) => (
                    <ChartPath
                      points={parsedData.rawObject.pointCollections[averageKey()].points}
                      splits={parsedData.rawObject.splitCollections[averageKey()].splits}
                      startIndex={parsedData.rawObject.splitCollections[averageKey()].startIndex}
                      endIndex={parsedData.rawObject.splitCollections[averageKey()].endIndex}
                      stroke={arrayUtils.atWithWrapping(colors, i())}
                      {...linesArea2}
                      {...combinedValues()}
                      {...controls}
                    ></ChartPath>
                  )}</For>
                  <ChartMousePositionInPercentage {...controls} {...chartArea} width={linesArea2.width} x={linesArea2.x}>{mouseArea => (
                    <>
                      <ChartPercentageVerticalLine {...mouseArea} />
                      <ChartHeader {...linesArea2} title={mouseArea.mouseXPercentage} />
                      <For each={props.listOfParsedCTM()}>{parsedData => (
                        <ChartHorizontalPointLineWithLabel
                          points={parsedData.rawObject.pointCollections[averageKey()].points}
                          splits={parsedData.rawObject.splitCollections[averageKey()].splits}
                          startIndex={parsedData.rawObject.splitCollections[averageKey()].startIndex}
                          endIndex={parsedData.rawObject.splitCollections[averageKey()].endIndex}
                          {...combinedValues()}
                          {...mouseArea}
                          {...linesArea2}
                          x={chartArea.x}
                          width={chartArea.width} />
                      )}</For>
                    </>
                  )}</ChartMousePositionInPercentage>
                </>
              )}</ChartPadding>
            )}</ChartXAxis>
          )}</ChartHeaderPadding>
        )}</ChartPadding>
      </svg>
    )
  }
}
