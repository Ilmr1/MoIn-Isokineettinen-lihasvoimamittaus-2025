import { batch, createEffect, createMemo, createRenderEffect, createSignal, ErrorBoundary } from "solid-js";
import { SVGChartContext, useSVGChartContext } from "../providers";
import { chartUtils, CTMUtils, signalUtils } from "../utils/utils";
import { asserts } from "../collections/collections";
import "./GenericSVGChart.css";

export function GenericSVGChart(props) {
  return (
    <ErrorBoundary fallback="Chart rendering failed">
      <Chart {...props} />
    </ErrorBoundary>
  );
}

function Chart(props) {
  const error = signalUtils.createAssertError(() => {
    asserts.assertTypeNumber(props.min, "min is not a number");
    asserts.assertTypeNumber(props.max, "max is not a number");

    asserts.assertTrue(props.max >= 0, "Max on pienempi kuin 0. Saattaa aiheuttaa ongelmia keskiviivan piirrossa, jos max on pienempi kuin 0. Tutki asiaa ja tämän voi poistaa sitten");

    asserts.assertTrue(props.dataIndex >= 0 && props.dataIndex <= 2, "dataIndex is not a number between 0-2");
  });

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

  const clearHoverCoors = () => batch(() => {
    setMouseX(-1);
    setMouseY(-1);
  });

  return (
    <Show when={!error()} fallback="Asserts failed">
      <SVGChartContext.Provider value={{ parsedCTM: () => props.parsedCTM, min: () => props.min, max: () => props.max, dataIndex: () => props.dataIndex, mouseX, mouseY }}>
        <svg class="cp-chart" classList={{ left: CTMUtils.isLeftLeg(props.parsedCTM), right: CTMUtils.isRightLeg(props.parsedCTM) }} width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
          <ChartWrapper title={props.title} width={width - paddingLeft - paddingRight} height={height - paddingTop - paddingBottom} x={paddingLeft} y={paddingTop} />
        </svg>
      </SVGChartContext.Provider>
    </Show>
  );
}

function ChartWrapper(props) {
  const paddingTop = 25;
  const paddingBottom = 25;

  const grid = createMemo(() => {
    const string = [];
    for (let i = 0; i < props.height / 50; i++) {
      string.push(`M ${props.x} ${props.y + i * 50} l ${props.width} 0`);
    }
    for (let i = 0; i < props.width / 50; i++) {
      string.push(`M ${props.x + i * 50} ${props.y} l 0 ${props.height}`);
    }
    return string.join(" ");
  });

  return (
    <>
      <text dominant-baseline="hanging" text-anchor="middle" x={props.x + props.width / 2} y="0">{props.title}</text>
      <rect x={props.x} y={props.y} width={props.width} height={props.height} fill="none" stroke="black" />
      <path d={grid()} stroke="black" stroke-width=".25" stroke-dasharray="2" fill="none" />
      <ChartContent {...props} height={props.height - paddingBottom - paddingTop} y={props.y + paddingTop} parentHeight={props.height} parentY={props.y} />
    </>
  );
}

function ChartContent(props) {
  const { mouseX, parsedCTM, min, max, dataIndex } = useSVGChartContext();

  const totalDataWidth = createMemo(() => parsedCTM().data.length);
  const totalDataHeight = createMemo(() => max() - min());

  const yStep = createMemo(() => props.height / totalDataHeight());
  const xStep = createMemo(() => props.width / totalDataWidth());

  const hover = createMemo(() => {
    const x = Math.round((mouseX() - props.x) / xStep());
    const y = parsedCTM().data[x]?.[dataIndex()];
    if (y == null) {
      return [-1, -1, null];
    }

    return [
      props.x + x * xStep(),
      props.y + chartUtils.flipYAxes(y, max()) * yStep(),
      y
    ];
  });
  const hoverX = createMemo(() => hover()[0]);
  const hoverY = createMemo(() => hover()[1]);
  const hoverValue = createMemo(() => hover()[2]);

  const path = createMemo(() => {
    return parsedCTM().data.map((row, x) => {
      const y = row[dataIndex()];
      const flippedY = chartUtils.flipYAxes(y, max());
      if (x === 0) {
        return `M ${props.x + x * xStep()} ${props.y + flippedY * yStep()}`;
      }
      return `L ${props.x + x * xStep()} ${props.y + flippedY * yStep()}`;
    }).join(" ");
  });

  const zeroLineY = createMemo(() => props.y + chartUtils.flipYAxes(0, max()) * yStep());

  return (
    <>
      <line x1={props.x} x2={props.x + props.width} y1={zeroLineY()} y2={zeroLineY()} stroke="gray" />
      <line x1={props.x} x2={props.x + props.width} y1={hoverY()} y2={hoverY()} stroke="black" />
      <line x1={hoverX()} x2={hoverX()} y1={props.parentY} y2={props.parentY + props.parentHeight} stroke="black" />
      <path d={path()} class="data" fill="none" />
      <text dominant-baseline="middle" text-anchor="end" x={props.x - 2} y={hoverY()}>{hoverValue()}</text>
    </>
  );
}
