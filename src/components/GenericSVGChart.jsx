import { batch, createMemo, createSignal, ErrorBoundary } from "solid-js";
import { SVGChartContext } from "../providers";
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

    asserts.assertTruthy(props.max >= 0, "Max on pienempi kuin 0. Saattaa aiheuttaa ongelmia keskiviivan piirrossa, jos max on pienempi kuin 0. Tutki asiaa ja tämän voi poistaa sitten");

    asserts.assertTruthy(props.dataIndex >= 0 && props.dataIndex <= 2, "dataIndex is not a number between 0-2");
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

export function ChartWrapper(props) {
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

export function ChartWrapperWithPadding(props) {
  const paddingTop = 25;
  const paddingBottom = 25;
  const paddingInline = 25;

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
      <ChartContent {...props} x={props.x + paddingInline} width={props.width - paddingInline * 2} height={props.height - paddingBottom - paddingTop} y={props.y + paddingTop} parentHeight={props.height} parentY={props.y} />
    </>
  );
}

export function ChartContent(props) {
  asserts.assertTypeNumber(props.minValue);
  asserts.assertTypeNumber(props.maxValue);

  const minIndex = createMemo(() => props.startIndex);
  const maxIndex = createMemo(() => props.endIndex);
  const totalDataWidth = createMemo(() => maxIndex() - minIndex() + 1);
  const totalDataHeight = createMemo(() => props.maxValue - props.minValue);

  const yStep = createMemo(() => props.height / totalDataHeight());
  const xStep = createMemo(() => props.width / totalDataWidth());

  const hover = createMemo(() => {
    const mX = props.mouseX();
    const x = Math.round((mX - props.x) / xStep());
    const y = props.points[x + minIndex()];
    if (y == null || x < 0 || mX > props.x + props.width) {
      return { x: -1, y: -1, value: null };
    }


    return {
      x: props.x + x * xStep(),
      y: props.y + chartUtils.flipYAxes(y, props.maxValue) * yStep(),
      value: y,
      index: x + minIndex()
    };
  });

  const paths = createMemo(() => {
    return props.splits.map(split => {
      const xS = xStep(), yS = yStep(), m = props.maxValue;
      const paths = [`M ${props.x + (split.startIndex - props.startIndex) * xS} ${props.y + chartUtils.flipYAxes(props.points[split.startIndex], m) * yS}`]
      for (let x = split.startIndex + 1; x < split.endIndex; x++) {
        const y = props.points[x];
        const flippedY = chartUtils.flipYAxes(y, m);
        paths.push(`L ${props.x + (x - props.startIndex) * xS} ${props.y + flippedY * yS}`);
      }
      return paths.join(" ");
    })
  });

  const zeroLineY = createMemo(() => props.y + chartUtils.flipYAxes(0, props.maxValue) * yStep());

  return (
    <>
      {/* <For each={parsedCTM().markersByIndex["move 1"]}>{x => ( */}
      {/*   <line x1={props.x + (x - minIndex()) * xStep()} x2={props.x + (x - minIndex()) * xStep()} y1={props.parentY} y2={props.parentY + props.parentHeight} stroke="red" /> */}
      {/* )}</For> */}
      {/* <For each={parsedCTM().markersByIndex["move 2"]}>{x => ( */}
      {/*   <line x1={props.x + (x - minIndex()) * xStep()} x2={props.x + (x - minIndex()) * xStep()} y1={props.parentY} y2={props.parentY + props.parentHeight} stroke="blue" /> */}
      {/* )}</For> */}
      <line x1={props.x} x2={props.x + props.width} y1={zeroLineY()} y2={zeroLineY()} stroke="gray" />
      <line x1={props.x} x2={props.x + props.width} y1={hover().y} y2={hover().y} stroke="black" />
      <line x1={hover().x} x2={hover().x} y1={props.parentY} y2={props.parentY + props.parentHeight} stroke="black" />
      <text dominant-baseline="start" text-anchor="end" x={hover().x} y={props.parentY}>{hover().index}</text>
      <For each={paths()}>{(path, i) => (
        <path d={path} class="data" fill="none" stroke={props.splits[i()].color} />
      )}</For>
      <text dominant-baseline="middle" text-anchor="end" x={props.x - 2} y={hover().y}>{hover().value}</text>
    </>
  );
}
