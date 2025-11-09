import { createMemo, ErrorBoundary, mergeProps } from "solid-js";
import { ChartBorder, ChartFooter, ChartGrid, ChartGridAlignedWithFloorYAxisLabels, ChartHeader, ChartPadding, ChartYAxisFloor } from "./GenericSVGChart.jsx";
import "./GenericSVGChart.css";
import { arrayUtils, numberUtils } from "../utils/utils.js";
import { asserts } from "../collections/collections.js";
export function BarChart(props) {

  return (
    <ErrorBoundary fallback="Three chart rendering failed">
      <Chart {...props} />
    </ErrorBoundary>
  );
}

function Chart(props) {
  asserts.assertTypeString(props.title, "title");

  const svgArea = { width: 300, height: 300, x: 0, y: 0 };

  return (
    <Show when={props.listOfParsedCTM()?.length}>
      <AverageErrorChartForTorque {...props} />
    </Show>
  );

  function AverageErrorChartForTorque(props) {
    return (
      <svg width={svgArea.width} height={svgArea.height}>
        <ChartPadding {...svgArea} paddingRight={45} paddingTop={40} paddingBottom={20}>{chartArea => (
          <>
            {/* <ChartBorder {...chartArea} /> */}
            <text y={chartArea.y} dy="-1.2em">
              <tspan dominant-baseline="ideographic" text-anchor="middle" x={chartArea.x + chartArea.width / 2}>{props.title}</tspan>
              <tspan dominant-baseline="ideographic" text-anchor="middle" x={chartArea.x + chartArea.width / 2} dy="1.2em">{props.unit}</tspan>
            </text>
            <ChartPadding {...chartArea} paddingTop={20}>{barArea => (
              <BarGroups {...barArea} {...props} unit=""></BarGroups>
            )}</ChartPadding>
          </>
        )}</ChartPadding>
      </svg>
    )
  }

  function BarGroups(props) {
    asserts.assertIsIntegerLike(props.analysisExtKey, "analysisExtKey");
    asserts.assertIsIntegerLike(props.analysisFlexKey, "analysisFlexKey");

    const groups = createMemo(() => {
      const ext = [];
      const flex = [];
      for (const { rawObject: { analysis } } of props.listOfParsedCTM()) {
        ext.push(Math.abs(analysis[props.analysisExtKey]));
        flex.push(Math.abs(analysis[props.analysisFlexKey]));
      }

      return [ext, flex];
    });

    const maxValue = createMemo(() => arrayUtils.maxValue(groups().map(values => arrayUtils.maxValue(values))));
    const colors = createMemo(() => props.listOfParsedCTM()?.map(ctmData => ctmData.baseColor));
    const groupNames = ["Ext", "Flex"];

    return (
      <>
        <ChartYAxisFloor {...props} decimals={3} startValue={maxValue()} endValue={0} />
        <ChartGridAlignedWithFloorYAxisLabels
          startValue={maxValue()}
          endValue={0}
          {...props}
        />
        <ChartPadding {...props} paddingInline={20}>{barArea => (
          <BarLineGroups {...barArea} gap={10} values={groups()} maxValue={maxValue()} colors={colors()} groupNames={groupNames} />
        )}</ChartPadding>
      </>
    );
  }
}
function BarLineGroups(props) {
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assert2DArrayOfNumbersOrEmptyArray(props.values, "values");
  asserts.assertTypeNumber(props.maxValue, "maxValue");

  props = mergeProps({ gap: 0 }, props);

  const barWidth = createMemo(() => (props.width - ((props.values.length - 1) * props.gap)) / props.values.length);

  return (
    <For each={props.values}>{(group, i) => (
      <ChartPadding
        {...props}
        x={props.x + barWidth() * i() + props.gap * i()}
        width={barWidth()}
      >{barLineArea => (
          <>
            <BarChartLine {...props} {...barLineArea} gap={0} values={group} />
            <ChartFooter {...barLineArea} title={props.groupNames?.[i()]} />
          </>
        )}
      </ChartPadding>
    )}</For>
  )
}

function BarChartLine(props) {
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assert1DArrayOfNumbersOrEmptyArray(props.values, "values");
  asserts.assertTypeNumber(props.maxValue, "maxValue");

  props = mergeProps({ gap: 0 }, props);

  const barWidth = createMemo(() => (props.width - ((props.values.length - 1) * props.gap)) / props.values.length);

  return (
    <For each={props.values}>{(value, i) => (
      <ChartPadding
        x={props.x + barWidth() * i() + props.gap * i()}
        width={barWidth()}
        height={(value / props.maxValue) * props.height}
        y={props.y + props.height - (value / props.maxValue) * props.height}
      >{barArea => (
          <>
            <ChartHeader {...barArea} title={numberUtils.padRoundDecimalsToLength(value, 3)} />
            <rect {...barArea} fill={props.colors?.[i()] ?? "grey"}></rect>
          </>
        )}
      </ChartPadding>
    )}</For>
  )
}
