import { batch, createMemo, createSignal, ErrorBoundary } from "solid-js";
import {
  ChartBorder,
  ChartErrorBands,
  ChartGridAlignedWithFloorYAxisLabels,
  ChartHorizontalHoverPointLine,
  ChartHoverToolTip,
  ChartMousePositionInPercentage,
  ChartPadding,
  ChartPath,
  ChartPercentageVerticalLine,
  ChartText,
  ChartXAxisFloor,
  ChartYAxisFloor,
} from "./GenericSVGChart.jsx";
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

  const updateHoverCoords = (e) =>
    batch(() => {
      setMouseX(e.offsetX);
      setMouseY(e.offsetY);
    });

  const clearHoverCoors = () =>
    batch(() => {
      setMouseX(-1);
      setMouseY(-1);
    });
  const svgWidth = props.svgWidth ?? 800;
  const svgHeight = props.svgHeight ?? 250;

  const controls = { mouseX, mouseY };
  const svgArea = { width: svgWidth, height: svgHeight, x: 0, y: 0 };
  return (
    <Show when={props.listOfParsedCTM()?.length}>
      <AverageErrorChartForTorque type="Ext" {...props} />
      <AverageErrorChartForTorque type="Flex" {...props} />
      <AngleSpecificHQRatio type="Flex" {...props} />
    </Show>
  );

  function AverageErrorChartForTorque(props) {
    asserts.assertTypeFunction(props.listOfParsedCTM, "listOfParsedCTM");
    asserts.assertTruthy(
      props.type === "Ext" || props.type === "Flex",
      "Unkown type",
    );

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
          if (
            (type === "Flex" && split.color === "blue") ||
            (type === "Ext" && split.color === "red")
          ) {
            const start =
              rawObject.pointCollections.angle.points[split.startIndex];
            const end = rawObject.pointCollections.angle.points[split.endIndex];
            startAngles.push(Math.max(start, end));
            endAngles.push(Math.min(start, end));
          }
        }
      }

      const xStartValue = arrayUtils.findByMaxDelta(startAngles, 0) || -1;
      const xEndValue = arrayUtils.findByMaxDelta(endAngles, 0) || 1;

      return {
        minValue: Math.min(
          ...files.map(
            (parsedData) =>
              parsedData.rawObject.pointCollections[errorAverageKey()].minValue,
          ),
        ),
        maxValue: Math.max(
          ...files.map(
            (parsedData) =>
              parsedData.rawObject.pointCollections[errorAverageKey()].maxValue,
          ),
        ),
        xStartValue,
        xEndValue,
      };
    });

    const colors = createMemo(() =>
      props.listOfParsedCTM().map((file) => file.baseColor),
    );

    return (
      <svg
        width={svgArea.width}
        height={svgArea.height}
        onMouseLeave={clearHoverCoors}
        onMouseMove={updateHoverCoords}
      >
        <ChartPadding
          name="border"
          {...svgArea}
          paddingLeft={80}
          paddingRight={50}
          paddingBottom={40}
          paddingTop={22}
        >
          {(borderArea) => (
            <>
              <ChartText
                position="top"
                {...borderArea}
                title={props.type + " average"}
              />
              <ChartBorder {...borderArea} />
              <ChartPadding name="lines" {...borderArea} padding={15}>
                {(lineArea) => (
                  <>
                    <ChartGridAlignedWithFloorYAxisLabels
                      startValue={combinedValues().maxValue}
                      endValue={combinedValues().minValue}
                      {...lineArea}
                      x={borderArea.x}
                      width={borderArea.width}
                    />
                    <text
                      x={borderArea.x + borderArea.width}
                      y={borderArea.y}
                      dominant-baseline="ideographic"
                      text-anchor="end"
                    >
                      Torque [Nm]
                    </text>
                    <ChartText
                      position="bottom"
                      {...borderArea}
                      y={borderArea.y + 20}
                      title="Position [deg]"
                    />
                    <ChartXAxisFloor
                      {...borderArea}
                      startValue={combinedValues().xStartValue}
                      endValue={combinedValues().xEndValue}
                      x={lineArea.x}
                      width={lineArea.width}
                    />
                    <ChartYAxisFloor
                      {...borderArea}
                      startValue={combinedValues().maxValue}
                      endValue={combinedValues().minValue}
                      y={lineArea.y}
                      height={lineArea.height}
                    />
                    <Show when={props.errorBands}>
                      <g data-error-bands>
                        <For each={props.listOfParsedCTM()}>
                          {(parsedData) => (
                            <ChartErrorBands
                              points={
                                parsedData.rawObject.pointCollections[
                                  errorAverageKey()
                                ].points
                              }
                              splits={
                                parsedData.rawObject.splitCollections[
                                  averageKey()
                                ].splits
                              }
                              startIndex={
                                parsedData.rawObject.splitCollections[
                                  averageKey()
                                ].startIndex
                              }
                              endIndex={
                                parsedData.rawObject.splitCollections[
                                  averageKey()
                                ].endIndex
                              }
                              fill={`color-mix(in oklab, ${parsedData.baseColor} 15%, transparent)`}
                              stroke={`color-mix(in oklab, ${parsedData.baseColor} 30%, transparent)`}
                              {...lineArea}
                              {...combinedValues()}
                            ></ChartErrorBands>
                          )}
                        </For>
                      </g>
                    </Show>
                    <g data-lines>
                      <For each={props.listOfParsedCTM()}>
                        {(parsedData) => (
                          <ChartPath
                            points={
                              parsedData.rawObject.pointCollections[
                                averageKey()
                              ].points
                            }
                            splits={
                              parsedData.rawObject.splitCollections[
                                averageKey()
                              ].splits
                            }
                            startIndex={
                              parsedData.rawObject.splitCollections[
                                averageKey()
                              ].startIndex
                            }
                            endIndex={
                              parsedData.rawObject.splitCollections[
                                averageKey()
                              ].endIndex
                            }
                            stroke={parsedData.baseColor}
                            {...lineArea}
                            {...combinedValues()}
                            {...controls}
                          ></ChartPath>
                        )}
                      </For>
                    </g>
                    <ChartMousePositionInPercentage
                      {...controls}
                      {...borderArea}
                      width={lineArea.width}
                      x={lineArea.x}
                    >
                      {(mouseArea) => (
                        <>
                          <ChartPercentageVerticalLine
                            {...mouseArea}
                            y={borderArea.y}
                            height={borderArea.height}
                          />
                          <For each={props.listOfParsedCTM()}>
                            {(parsedData) => (
                              <ChartHorizontalHoverPointLine
                                points={
                                  parsedData.rawObject.pointCollections[
                                    averageKey()
                                  ].points
                                }
                                splits={
                                  parsedData.rawObject.splitCollections[
                                    averageKey()
                                  ].splits
                                }
                                startIndex={
                                  parsedData.rawObject.splitCollections[
                                    averageKey()
                                  ].startIndex
                                }
                                endIndex={
                                  parsedData.rawObject.splitCollections[
                                    averageKey()
                                  ].endIndex
                                }
                                {...combinedValues()}
                                {...mouseArea}
                                {...lineArea}
                                x={borderArea.x}
                                width={borderArea.width}
                              />
                            )}
                          </For>
                          <ChartHoverToolTip
                            {...mouseArea}
                            {...lineArea}
                            x={borderArea.x}
                            xWithPadding={lineArea.x}
                            listOfPoints={props
                              .listOfParsedCTM()
                              .map(
                                (v) =>
                                  v.rawObject.pointCollections[averageKey()]
                                    .points,
                              )}
                            listOfSplits={props
                              .listOfParsedCTM()
                              .map(
                                (v) =>
                                  v.rawObject.splitCollections[averageKey()],
                              )}
                            maxValue={combinedValues().maxValue}
                            minValue={combinedValues().minValue}
                            colors={colors()}
                            unit="Nm"
                          />
                        </>
                      )}
                    </ChartMousePositionInPercentage>
                  </>
                )}
              </ChartPadding>
            </>
          )}
        </ChartPadding>
      </svg>
    );
  }

  function AngleSpecificHQRatio(props) {
    asserts.assertTypeFunction(props.listOfParsedCTM, "listOfParsedCTM");
    asserts.assertTruthy(
      props.type === "Ext" || props.type === "Flex",
      "Unkown type",
    );

    const combinedValues = createMemo(() => {
      const files = props.listOfParsedCTM();
      const startAngles = [];
      const endAngles = [];
      for (const { rawObject } of files) {
        startAngles.push(
          rawObject.pointCollections.angleSpecificHQRatio.maxAngle,
        );
        endAngles.push(
          rawObject.pointCollections.angleSpecificHQRatio.minAngle,
        );
      }

      const xStartValue = arrayUtils.findByMaxDelta(startAngles, 0) || -1;
      const xEndValue = arrayUtils.findByMaxDelta(endAngles, 0) || 1;

      return {
        minValue: Math.min(
          ...files.map(
            (parsedData) =>
              parsedData.rawObject.pointCollections.angleSpecificHQRatio
                .minValue,
          ),
        ),
        maxValue: Math.max(
          ...files.map(
            (parsedData) =>
              parsedData.rawObject.pointCollections.angleSpecificHQRatio
                .maxValue,
          ),
        ),
        xStartValue,
        xEndValue,
      };
    });

    const colors = createMemo(() =>
      props.listOfParsedCTM().map((file) => file.baseColor),
    );

    return (
      <Show when={combinedValues().maxValue}>
        <svg
          width={svgArea.width}
          height={svgArea.height}
          onMouseLeave={clearHoverCoors}
          onMouseMove={updateHoverCoords}
        >
          <ChartPadding
            name="border"
            {...svgArea}
            paddingLeft={80}
            paddingRight={50}
            paddingBottom={40}
            paddingTop={22}
          >
            {(borderArea) => (
              <>
                <ChartText
                  position="top"
                  {...borderArea}
                  title="Angle Specific HQ-ratio"
                />
                <ChartBorder {...borderArea} />
                <ChartPadding name="lines" {...borderArea} padding={15}>
                  {(lineArea) => (
                    <>
                      <ChartGridAlignedWithFloorYAxisLabels
                        startValue={combinedValues().maxValue}
                        endValue={combinedValues().minValue}
                        {...lineArea}
                        x={borderArea.x}
                        width={borderArea.width}
                      />
                      <ChartText
                        position="bottom"
                        {...borderArea}
                        y={borderArea.y + 20}
                        title="Position [deg]"
                      />
                      <ChartXAxisFloor
                        {...borderArea}
                        startValue={combinedValues().xStartValue}
                        endValue={combinedValues().xEndValue}
                        x={lineArea.x}
                        width={lineArea.width}
                      />
                      <ChartYAxisFloor
                        {...borderArea}
                        startValue={combinedValues().maxValue}
                        endValue={combinedValues().minValue}
                        y={lineArea.y}
                        height={lineArea.height}
                      />
                      {/* <Show when={props.errorBands}> */}
                      {/*   <g data-error-bands> */}
                      {/*     <For each={props.listOfParsedCTM()}>{parsedData => ( */}
                      {/*       <ChartErrorBands */}
                      {/*         points={parsedData.rawObject.pointCollections.angleSpecificHQRatioError.points} */}
                      {/*         splits={parsedData.rawObject.splitCollections.angleSpecificHQRatio.splits} */}
                      {/*         startIndex={parsedData.rawObject.splitCollections.angleSpecificHQRatio.startIndex} */}
                      {/*         endIndex={parsedData.rawObject.splitCollections.angleSpecificHQRatio.endIndex} */}
                      {/*         fill={`color-mix(in oklab, ${parsedData.baseColor} 15%, transparent)`} */}
                      {/*         stroke={`color-mix(in oklab, ${parsedData.baseColor} 30%, transparent)`} */}
                      {/*         {...lineArea} */}
                      {/*         {...combinedValues()} */}
                      {/*       ></ChartErrorBands> */}
                      {/*     )}</For> */}
                      {/*   </g> */}
                      {/* </Show> */}
                      <g data-lines>
                        <For each={props.listOfParsedCTM()}>
                          {(parsedData) => (
                            <>
                              <ChartPath
                                points={
                                  parsedData.rawObject.pointCollections
                                    .angleSpecificHQRatio.points
                                }
                                splits={
                                  parsedData.rawObject.splitCollections
                                    .angleSpecificHQRatio.splits
                                }
                                startIndex={
                                  parsedData.rawObject.splitCollections
                                    .angleSpecificHQRatio.startIndex
                                }
                                endIndex={
                                  parsedData.rawObject.splitCollections
                                    .angleSpecificHQRatio.endIndex
                                }
                                stroke={parsedData.baseColor}
                                {...combinedValues()}
                                {...lineArea}
                                {...controls}
                              ></ChartPath>
                            </>
                          )}
                        </For>
                      </g>
                      <ChartMousePositionInPercentage
                        {...controls}
                        {...borderArea}
                        width={lineArea.width}
                        x={lineArea.x}
                      >
                        {(mouseArea) => (
                          <>
                            <ChartPercentageVerticalLine
                              {...mouseArea}
                              y={borderArea.y}
                              height={borderArea.height}
                            />
                            <For each={props.listOfParsedCTM()}>
                              {(parsedData) => (
                                <ChartHorizontalHoverPointLine
                                  points={
                                    parsedData.rawObject.pointCollections
                                      .angleSpecificHQRatio.points
                                  }
                                  splits={
                                    parsedData.rawObject.splitCollections
                                      .angleSpecificHQRatio.splits
                                  }
                                  startIndex={
                                    parsedData.rawObject.splitCollections
                                      .angleSpecificHQRatio.startIndex
                                  }
                                  endIndex={
                                    parsedData.rawObject.splitCollections
                                      .angleSpecificHQRatio.endIndex
                                  }
                                  {...combinedValues()}
                                  {...mouseArea}
                                  {...lineArea}
                                  x={borderArea.x}
                                  width={borderArea.width}
                                />
                              )}
                            </For>
                            <ChartHoverToolTip
                              {...mouseArea}
                              {...lineArea}
                              x={borderArea.x}
                              xWithPadding={lineArea.x}
                              listOfPoints={props
                                .listOfParsedCTM()
                                .map(
                                  (v) =>
                                    v.rawObject.pointCollections
                                      .angleSpecificHQRatio.points,
                                )}
                              listOfSplits={props
                                .listOfParsedCTM()
                                .map(
                                  (v) =>
                                    v.rawObject.splitCollections
                                      .angleSpecificHQRatio,
                                )}
                              maxValue={combinedValues().maxValue}
                              minValue={combinedValues().minValue}
                              colors={colors()}
                            />
                          </>
                        )}
                      </ChartMousePositionInPercentage>
                    </>
                  )}
                </ChartPadding>
              </>
            )}
          </ChartPadding>
        </svg>
      </Show>
    );
  }
}
