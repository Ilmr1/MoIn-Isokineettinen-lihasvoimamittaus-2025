import { batch, createMemo, createSignal, ErrorBoundary, mergeProps } from "solid-js";
import { SVGChartContext } from "../providers";
import { ChartBorder, ChartErrorBands, ChartGrid, ChartHeader, ChartHorizontalPointLineWithLabel, ChartMousePositionInPercentage, ChartPadding, ChartPath, ChartPercentageVerticalLine, ChartWrapper, ChartWrapperWithPadding } from "./GenericSVGChart.jsx";
import "./GenericSVGChart.css";
import { arrayUtils } from "../utils/utils.js";
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

  const sizes2 = mergeProps({
    width: 800,
    height: 200,
    x: 0,
    y: 0,
  }, props);

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

  const combinedExtValues = createMemo(() => ({
    minValue: Math.min(...props.listOfParsedCTM().map(parsedData => parsedData.rawObject.pointCollections.averagePowerExtError.minValue)),
    maxValue: Math.max(...props.listOfParsedCTM().map(parsedData => parsedData.rawObject.pointCollections.averagePowerExtError.maxValue)),
    // startIndex: Math.min(...props.listOfParsedCTM().map(parsedData => parsedData.rawObject.splitCollections.averagePowerExt.startIndex)),
    // endIndex: Math.max(...props.listOfParsedCTM().map(parsedData => parsedData.rawObject.splitCollections.averagePowerExt.endIndex)),
  }));

  const colors = ["oklch(70.4% 0.191 22.216)", "oklch(79.2% 0.209 151.711)", "oklch(62.3% 0.214 259.815)", "oklch(85.2% 0.199 91.936)"];
  const strokeColor = colors.map(color => `color-mix(in oklab, ${color} 50%, transparent)`);
  const fillColor = colors.map(color => `color-mix(in oklab, ${color} 15%, transparent)`);
  const getColorStyles = i => ({
    fill: arrayUtils.atWithWrapping(fillColor, i),
    stroke: arrayUtils.atWithWrapping(strokeColor, i),
  });

  return (
    <Show when={props.listOfParsedCTM()?.length}>
      <svg class="cp-chart" width={sizes2.width} height={sizes2.height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
        <ChartPadding {...sizes2} paddingLeft={100} paddingTop={18} paddingRight={1} paddingBottom={1}>{chartArea => (
          <>
            <ChartGrid {...chartArea} />
            <ChartBorder {...chartArea} />
            <ChartHeader {...chartArea} title="Ext average" />
            <ChartPadding {...chartArea} paddingInline={25} paddingBlock={25}>{linesArea => (
              <>
                <For each={props.listOfParsedCTM()}>{(parsedData, i) => (
                  <ChartErrorBands
                    points={parsedData.rawObject.pointCollections.averagePowerExtError.points}
                    splits={parsedData.rawObject.splitCollections.averagePowerExt.splits}
                    startIndex={parsedData.rawObject.splitCollections.averagePowerExt.startIndex}
                    endIndex={parsedData.rawObject.splitCollections.averagePowerExt.endIndex}
                    {...getColorStyles(i())}
                    {...linesArea}
                    {...combinedExtValues()}
                  ></ChartErrorBands>
                )}</For>
                <For each={props.listOfParsedCTM()}>{(parsedData, i) => (
                  <ChartPath
                    points={parsedData.rawObject.pointCollections.averagePowerExt.points}
                    splits={parsedData.rawObject.splitCollections.averagePowerExt.splits}
                    startIndex={parsedData.rawObject.splitCollections.averagePowerExt.startIndex}
                    endIndex={parsedData.rawObject.splitCollections.averagePowerExt.endIndex}
                    stroke={arrayUtils.atWithWrapping(colors, i())}
                    {...linesArea}
                    {...combinedExtValues()}
                    {...controls}
                  ></ChartPath>
                )}</For>
                <ChartMousePositionInPercentage {...controls} {...chartArea} width={linesArea.width} x={linesArea.x}>{mouseArea => (
                  <>
                    <ChartPercentageVerticalLine {...mouseArea} />
                    <ChartHeader {...linesArea} title={mouseArea.mouseXPercentage} />
                    <For each={props.listOfParsedCTM()}>{parsedData => (
                      <ChartHorizontalPointLineWithLabel
                        points={parsedData.rawObject.pointCollections.averagePowerExt.points}
                        splits={parsedData.rawObject.splitCollections.averagePowerExt.splits}
                        startIndex={parsedData.rawObject.splitCollections.averagePowerExt.startIndex}
                        endIndex={parsedData.rawObject.splitCollections.averagePowerExt.endIndex}
                        {...combinedExtValues()}
                        {...mouseArea}
                        {...linesArea}
                        x={chartArea.x}
                        width={chartArea.width}
                      />
                    )}</For>
                  </>
                )}</ChartMousePositionInPercentage>
              </>
            )}</ChartPadding>
          </>
        )}</ChartPadding>
      </svg>
      <svg class="cp-chart" width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
        <For each={props.listOfParsedCTM()}>{parsedData => (
          <>
            <ChartWrapperWithPadding
              title="Flex average"
              points={parsedData.rawObject.pointCollections.averagePowerFlex.points}
              maxValue={parsedData.rawObject.pointCollections.averagePowerFlexError.maxValue}
              minValue={parsedData.rawObject.pointCollections.averagePowerFlexError.minValue}
              splits={parsedData.rawObject.splitCollections.averagePowerFlex.splits}
              startIndex={parsedData.rawObject.splitCollections.averagePowerFlex.startIndex}
              endIndex={parsedData.rawObject.splitCollections.averagePowerFlex.endIndex}
              {...sizes}
              {...controls}
            />
            <ChartPadding {...sizes} paddingInline={25} paddingBlock={25}>{container => (
              <ChartErrorBands
                points={parsedData.rawObject.pointCollections.averagePowerFlexError.points}
                maxValue={parsedData.rawObject.pointCollections.averagePowerFlexError.maxValue}
                minValue={parsedData.rawObject.pointCollections.averagePowerFlexError.minValue}
                splits={parsedData.rawObject.splitCollections.averagePowerFlex.splits}
                startIndex={parsedData.rawObject.splitCollections.averagePowerFlex.startIndex}
                endIndex={parsedData.rawObject.splitCollections.averagePowerFlex.endIndex}
                {...container}
                {...controls}
              ></ChartErrorBands>
            )}</ChartPadding>
          </>
        )}</For>
      </svg>
    </Show>
  );

}
