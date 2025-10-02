import { createMemo, ErrorBoundary } from "solid-js";
import { ChartBorder, ChartFooter, ChartGrid, ChartHeader, ChartPadding } from "./GenericSVGChart.jsx";
import "./GenericSVGChart.css";
import { arrayUtils } from "../utils/utils.js";
import { asserts } from "../collections/collections.js";
export function BarChart(props) {

  return (
    <ErrorBoundary fallback="Three chart rendering failed">
      <Chart {...props} />
    </ErrorBoundary>
  );
}

function Chart(props) {
  const svgArea = { width: 800, height: 600, x: 0, y: 0 };

  const colors = ["oklch(70.4% 0.191 22.216)", "oklch(79.2% 0.209 151.711)", "oklch(62.3% 0.214 259.815)", "oklch(85.2% 0.199 91.936)"];

  return (
    <Show when={props.listOfParsedCTM()?.length}>
      <AverageErrorChartForTorque {...props} />
    </Show>
  );

  function AverageErrorChartForTorque(props) {

    return (
      <svg width={svgArea.width} height={svgArea.height}>
        <ChartPadding {...svgArea} paddingLeft={100} paddingTop={18} paddingRight={1} paddingBottom={1}>{chartArea => (
          <>
            <ChartGrid {...chartArea} />
            <ChartBorder {...chartArea} />
            <ChartHeader {...chartArea} title="Torque max" />
            <ChartPadding {...chartArea} paddingInline={25} paddingBlock={25}>{linesArea => (
              <BarGroups {...linesArea} {...props}></BarGroups>
            )}</ChartPadding>
          </>
        )}</ChartPadding>
      </svg>
    )
  }

  function BarGroups(props) {
    asserts.assertTypeNumber(props.maxValue, "maxValue");

    const gap = 100;
    const groups = createMemo(() => {
      const ext = [];
      const flex = [];
      for (const { rawObject: { analysis } } of props.listOfParsedCTM()) {
        ext.push(Math.abs(analysis[110]));
        flex.push(Math.abs(analysis[111]));
      }

      return [ext, flex];
    });
    const section = createMemo(() => props.width / groups().length);
    const barsSectionWidth = createMemo(() => section() - gap / Math.max(groups().length, 1));
    const gapStep = createMemo(() => gap / Math.max(groups().length - 1, 1));
    const maxValue = createMemo(() => arrayUtils.maxValue(groups().map(values => arrayUtils.maxValue(values))));
    const barWidth = createMemo(() => barsSectionWidth() / groups()[0].length);

    const groupNames = ["Ext", "Flex"];

    return (
      <For each={groups()}>{(group, i) => (
        <ChartPadding
          {...props}
          x={props.x + barsSectionWidth() * i() + gapStep() * i()}
          width={barsSectionWidth()}
        >
          {groupArea => (
            <>
              <For each={group}>{(value, j) => (
                <ChartPadding
                  x={groupArea.x + barWidth() * j()}
                  width={barWidth()}
                  height={(value / maxValue()) * props.height}
                  y={props.y + props.height - (value / maxValue()) * props.height}
                >{bounds => (
                    <>
                      <ChartHeader {...bounds} title={value} />
                      <rect {...bounds} fill={arrayUtils.atWithWrapping(colors, j())}></rect>
                    </>
                  )}
                </ChartPadding>
              )}</For>
              <ChartFooter {...groupArea} title={groupNames[i()]} />
            </>
          )}
        </ChartPadding>
      )}</For>
    );
  }
}

