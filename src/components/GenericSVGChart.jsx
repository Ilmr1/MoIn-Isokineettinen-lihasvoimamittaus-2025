import { batch, createMemo, createRenderEffect, createSignal, ErrorBoundary, mergeProps, splitProps } from "solid-js";
import { arrayUtils, chartUtils, CTMUtils, numberUtils } from "../utils/utils";
import { asserts, signals } from "../collections/collections";
import "./GenericSVGChart.css";
import { createStore, produce } from "solid-js/store";

const debug = false;
const labelIncrements = [0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1, 2, 4, 5, 10, 20, 25, 40, 50, 100, 250, 500];

export function GenericSVGChart(props) {
  return (
    <ErrorBoundary fallback="Chart rendering failed">
      <Chart {...props} />
    </ErrorBoundary>
  );
}

function Chart(props) {
  const error = signals.assertError(() => {
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
      <svg class="cp-chart" classList={{ left: CTMUtils.isLeftLeg(props.parsedCTM), right: CTMUtils.isRightLeg(props.parsedCTM) }} width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
        <ChartWrapper title={props.title} width={width - paddingLeft - paddingRight} height={height - paddingTop - paddingBottom} x={paddingLeft} y={paddingTop} />
      </svg>
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

  return (
    <>
      <text dominant-baseline="hanging" text-anchor="middle" x={props.x + props.width / 2} y="0">{props.title}</text>
      <rect x={props.x} y={props.y} width={props.width} height={props.height} fill="none" stroke="black" />
      <ChartGrid {...props} />
      <ChartContent {...props} x={props.x + paddingInline} width={props.width - paddingInline * 2} height={props.height - paddingBottom - paddingTop} y={props.y + paddingTop} parentHeight={props.height} parentY={props.y} />
    </>
  );
}

export function ChartHeader(props) {
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  return (
    <text dominant-baseline="ideographic" text-anchor="middle" x={props.x + props.width / 2} y={props.y}>{props.title}</text>
  );
}

export function ChartTextTop(props) {
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  return (
    <text dominant-baseline="ideographic" text-anchor="middle" x={props.x + props.width / 2} y={props.y}>{props.title}</text>
  );
}

export function ChartTextBottom(props) {
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  return (
    <text dominant-baseline="hanging" text-anchor="middle" x={props.x + props.width / 2} y={props.y}>{props.title}</text>
  );
}

export function ChartTextRight(props) {
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  return (
    <text dominant-baseline="middle" text-anchor="start" x={props.x + props.width / 2} y={props.y}>{props.title}</text>
  );
}

export function ChartTextLeft(props) {
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  return (
    <text dominant-baseline="middle" text-anchor="end" x={props.x + props.width / 2} y={props.y}>{props.title}</text>
  );
}

export function ChartHeaderPadding(props) {
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ "font-size": 16 }, props);

  return (
    <>
      <text font-size={props["font-size"]} dominant-baseline="hanging" text-anchor="middle" x={props.x + props.width / 2} y={props.y}>{props.title}</text>
      <ChartPadding {...props} paddingTop={props["font-size"] * (64/48)} />
    </>
  );
}

export function ChartFooter(props) {
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  return (
    <text dominant-baseline="hanging" text-anchor="middle" x={props.x + props.width / 2} y={props.y + props.height}>{props.title}</text>
  );
}

export function ChartPercentageVerticalLine(props) {
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ stroke: "black", "stroke-width": 1 }, props);
  const [local, _] = splitProps(props, ["stroke", "stroke-width"]);

  return (
    <line
      x1={props.x + props.mouseXPercentage * props.width}
      x2={props.x + props.mouseXPercentage * props.width}
      y1={props.y}
      y2={props.y + props.height}
      {...local}
    />
  );
}

export function ChartHorizontalLineFromValue(props) {
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.maxValue, "maxValue");
  asserts.assertTypeNumber(props.minValue, "minValue");
  asserts.assertTypeNumber(props.value, "value");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ stroke: "black", "stroke-width": 1 }, props);
  const [local] = splitProps(props, ["stroke", "stroke-width"]);

  const y = createMemo(() => {
    const { height, minValue, maxValue, value} = props;
    const delta = maxValue - minValue;
    const y = chartUtils.flipYAxes((value - minValue) / delta * height, height);
    return y + props.y;
  });

  return (
    <line
      data-test
      x1={props.x}
      x2={props.x + props.width}
      y1={y()}
      y2={y()}
      {...local}
    />
  );
}

export function ChartHorizontalZeroLine(props) {
  asserts.assertTypeNumber(props.maxValue, "maxValue");
  asserts.assertTypeNumber(props.minValue, "minValue");

  return (
    <Show when={(props.minValue <= 0 && props.maxValue >= 0) || (props.minValue >= 0 && props.maxValue <= 0)}>
      <ChartHorizontalLineFromValue value={0} stroke="grey" {...props} />
    </Show>
  );
}

export function ChartHorizontalPointLineWithLabel(props) {
  asserts.assert1DArrayOfNumbersOrEmptyArray(props.points, "points");
  asserts.assertTypeNumber(props.endIndex, "endIndex");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.maxValue, "maxValue");
  asserts.assertTypeNumber(props.minValue, "minValue");
  asserts.assertTypeNumber(props.mouseXPercentage, "mouseXPercentage");
  asserts.assertTypeNumber(props.startIndex, "startIndex");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ stroke: "black", "stroke-width": 1 }, props);
  const [styles, _] = splitProps(props, ["stroke", "stroke-width"]);

  const hover = createMemo(() => {
    const {points, mouseXPercentage, startIndex, endIndex, height, maxValue, minValue} = props;
    if (mouseXPercentage === -1) {
      return { y: -1, value: null }
    }

    const delta = maxValue - minValue;
    const length = endIndex - startIndex;
    const index = startIndex + Math.round(mouseXPercentage * length);
    const value = points[index];
    if (value == null || index < startIndex || index > endIndex) {
      return { y: -1, value: null }
    }

    const y = chartUtils.flipYAxes((value - minValue) / delta * height, height);

    return { y: y + props.y, value }
  });

  return (
    <>
      <line
        x1={props.x}
        x2={props.x + props.width}
        y1={hover().y}
        y2={hover().y}
        {...styles}
      />
      <text dominant-baseline="middle" text-anchor="end" x={props.x - 5} y={hover().y}>{hover().value}</text>
    </>
  );
}

export function ChartHorizontalPointLine(props) {
  asserts.assert1DArrayOfNumbersOrEmptyArray(props.points, "points");
  asserts.assertTypeNumber(props.endIndex, "endIndex");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.maxValue, "maxValue");
  asserts.assertTypeNumber(props.minValue, "minValue");
  asserts.assertTypeNumber(props.mouseXPercentage, "mouseXPercentage");
  asserts.assertTypeNumber(props.startIndex, "startIndex");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ stroke: "black", "stroke-width": 1 }, props);
  const [styles, _] = splitProps(props, ["stroke", "stroke-width"]);

  const hover = createMemo(() => {
    const {points, mouseXPercentage, startIndex, endIndex, height, maxValue, minValue} = props;
    if (mouseXPercentage === -1) {
      return { y: -1, value: null }
    }

    const delta = maxValue - minValue;
    const length = endIndex - startIndex;
    const index = startIndex + Math.round(mouseXPercentage * length);
    const value = points[index];
    if (value == null || index < startIndex || index > endIndex) {
      return { y: -1, value: null }
    }

    const y = chartUtils.flipYAxes((value - minValue) / delta * height, height);

    return { y: y + props.y, value }
  });

  return (
    <line
      x1={props.x}
      x2={props.x + props.width}
      y1={hover().y}
      y2={hover().y}
      {...styles}
    />
  );
}

export function ChartHorizontalSplitLineWithLabel(props) {
  asserts.assert1DArrayOfNumbersOrEmptyArray(props.points, "points");
  asserts.assertTruthy(props.split, "split");
  asserts.assertTypeNumber(props.endIndex, "endIndex");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.maxValue, "maxValue");
  asserts.assertTypeNumber(props.minValue, "minValue");
  asserts.assertTypeNumber(props.mouseXPercentage, "mouseXPercentage");
  asserts.assertTypeNumber(props.startIndex, "startIndex");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ stroke: "black", "stroke-width": 1 }, props);
  const [styles, _] = splitProps(props, ["stroke", "stroke-width"]);

  const hover = createMemo(() => {
    const { points, mouseXPercentage, startIndex, endIndex, height, maxValue, minValue, split } = props;
    if (mouseXPercentage === -1) {
      return { y: -1, value: null }
    }

    const delta = maxValue - minValue;
    const length = endIndex - startIndex;
    const index = startIndex + Math.round(mouseXPercentage * length);
    const value = points[index];
    if (value == null || index < split.startIndex || index > split.endIndex) {
      return { y: -1, value: null }
    }

    const y = chartUtils.flipYAxes((value - minValue) / delta * height, height);

    return { y: y + props.y, value }
  });

  return (
    <>
      <line
        x1={props.x}
        x2={props.x + props.width}
        y1={hover().y}
        y2={hover().y}
        {...styles}
      />
      <text dominant-baseline="middle" text-anchor="end" x={props.x - 5} y={hover().y}>{hover().value}</text>
    </>
  );
}

export function ChartVecticalLinePercentageToRelativeIndex(props) {
  asserts.assert1DArrayOfNumbersOrEmptyArray(props.points, "points");
  asserts.assertTruthy(props.split, "split");
  asserts.assertTypeNumber(props.startIndex, "startIndex");
  asserts.assertTypeNumber(props.endIndex, "endIndex");
  asserts.assertTypeNumber(props.mouseXPercentage, "mouseXPercentage");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ stroke: "black", "stroke-width": 1 }, props);
  const [styles, _] = splitProps(props, ["stroke", "stroke-width"]);

  const posX = createMemo(() => {
    const { mouseXPercentage, startIndex, endIndex, width, split } = props;
    if (mouseXPercentage === -1) {
      return -1;
    }

    const length = (endIndex - startIndex);
    const index = startIndex + Math.round(mouseXPercentage * length);
    if (index < split.startIndex || index > split.endIndex) {
      return -1
    }

    const splitLength = split.endIndex - split.startIndex;
    const percentage = ((index - split.startIndex) / splitLength);

    if (props.flipped) {
      return (1 - percentage) * width
    }

    return percentage * width;
  });

  return (
    <Show when={posX() !== -1}>
      <line
        y1={props.y}
        y2={props.y + props.height}
        x1={props.x + posX()}
        x2={props.x + posX()}
        {...styles}
      />
    </Show>
  );
}

export function ChartBorder(props) {
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ fill: "none", stroke: "black", "stroke-width": 1 }, props);
  const [local, _] = splitProps(props, ["fill", "stroke", "width", "height", "x", "y", "stroke-width"]);

  return (
    <rect {...local} />
  );
}

export function ChartBorderPadding(props) {
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ "stroke-width": 1 }, props);

  return (
    <>
      <path
        d={`M${props.x} ${props.y} l${props.width} 0 l0 ${props.height} l${-props.width} 0 Z
        M${props.x + props["stroke-width"]} ${props.y + props["stroke-width"]} l${props.width - props["stroke-width"] * 2} 0 l0 ${props.height - props["stroke-width"] * 2} l${-props.width + props["stroke-width"] * 2} 0 Z`}
        fill="black" fill-rule="evenodd" stroke="none" />
      <ChartPadding {...props} paddingInline={props["stroke-width"]} paddingBlock={props["stroke-width"]} />
    </>
  );
}

export function ChartGrid(props) {
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({
    stroke: "black",
    "stroke-width": ".25",
    "stroke-dasharray": "2",
    fill: "none",
  }, props);
  const [local, _] = splitProps(props, ["fill", "stroke-width", "stroke-dasharray", "stroke"]);

  const grid = createMemo(() => {
    const string = [];
    const height = props.height, width = props.width, x = props.x, y = props.y;
    for (let i = 0; i < height / 50; i++) {
      string.push(`M ${x} ${y + i * 50} l ${width} 0`);
    }
    for (let i = 0; i < width / 50; i++) {
      string.push(`M ${x + i * 50} ${y} l 0 ${height}`);
    }
    return string.join(" ");
  });

  return (
    <path d={grid()} {...local} />
  );
}

export function ChartGridAlignedWithFloorXAxisLabels(props) {
  asserts.assertTypeNumber(props.startValue, "startValue");
  asserts.assertTypeNumber(props.endValue, "endValue");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({
    stroke: "black",
    "stroke-width": ".25",
    "stroke-dasharray": "2",
    fill: "none",
  }, props);
  const [local, _] = splitProps(props, ["fill", "stroke-width", "stroke-dasharray", "stroke"]);

  const idealSegmentSize = 40;

  const grid = createMemo(() => {
    const { x, y, height, width, startValue, endValue } = props;
    const initialDelta = numberUtils.absDelta(startValue, endValue);
    const idealSegmentCount = Math.round(width / idealSegmentSize);
    const rawLabelIncrementCount = initialDelta / idealSegmentCount;
    const closestLabelIncrementCount = arrayUtils.findByMinDelta(labelIncrements, rawLabelIncrementCount);

    const roundedStartValue = numberUtils.floorClosestToValue(startValue / closestLabelIncrementCount, endValue / closestLabelIncrementCount) * closestLabelIncrementCount;
    const roundedEndValue = numberUtils.floorClosestToValue(endValue / closestLabelIncrementCount, startValue / closestLabelIncrementCount) * closestLabelIncrementCount;
    const roundedDelta = numberUtils.absDelta(roundedStartValue, roundedEndValue);
    const labelSegmentCount = roundedDelta / closestLabelIncrementCount;

    const labelWidth = (width / initialDelta) * roundedDelta;

    const start = width * (numberUtils.absDelta(startValue, roundedStartValue) / initialDelta);
    const step = labelWidth / labelSegmentCount;
    const string = [];

    for (let i = start; i < width; i += step) {
      string.push(`M ${x + i} ${y} l 0 ${height}`);
    }

    return string.join(" ");
});

  return (
    <path d={grid()} {...local} />
  );
}

export function ChartGridAlignedWithFloorYAxisLabels(props) {
  asserts.assertTypeNumber(props.startValue, "startValue");
  asserts.assertTypeNumber(props.endValue, "endValue");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({
    stroke: "black",
    "stroke-width": ".25",
    "stroke-dasharray": "2",
    fill: "none",
  }, props);
  const [local, _] = splitProps(props, ["fill", "stroke-width", "stroke-dasharray", "stroke"]);

  const idealSegmentSize = 30;

  const grid = createMemo(() => {
    const { x, y, height, width, startValue, endValue } = props;
    const initialDelta = numberUtils.absDelta(startValue, endValue);
    const idealSegmentCount = Math.round(height / idealSegmentSize);
    const rawLabelIncrementCount = initialDelta / idealSegmentCount;
    const closestLabelIncrementCount = arrayUtils.findByMinDelta(labelIncrements, rawLabelIncrementCount);

    const roundedStartValue = numberUtils.floorClosestToValue(startValue / closestLabelIncrementCount, endValue / closestLabelIncrementCount) * closestLabelIncrementCount;
    const roundedEndValue = numberUtils.floorClosestToValue(endValue / closestLabelIncrementCount, startValue / closestLabelIncrementCount) * closestLabelIncrementCount;
    const roundedDelta = numberUtils.absDelta(roundedStartValue, roundedEndValue);
    const labelSegmentCount = roundedDelta / closestLabelIncrementCount;

    const labelHeight = (height / initialDelta) * roundedDelta;

    const start = height * (numberUtils.absDelta(startValue, roundedStartValue) / initialDelta);
    const step = labelHeight / labelSegmentCount;
    const string = [];

    for (let i = start; i < height; i += step) {
      string.push(`M ${x} ${y + i} l ${width} 0`);
    }

    return string.join(" ");
});

  return (
    <path d={grid()} {...local} />
  );
}

export function ChartMouseHoverValue(props) {
  asserts.assertTypeNumber(props.mouseX, "mouseX");
  asserts.assertTypeNumber(props.mouseY, "mouseY");
  asserts.assertTypeNumber(props.startIndex, "startIndex");
  asserts.assertTypeNumber(props.endIndex, "endIndex");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeArray(props.points, "points");
  asserts.assertTypeFunction(props.children, "children");

  const minIndex = createMemo(() => props.startIndex);
  const maxIndex = createMemo(() => props.endIndex);
  const totalDataWidth = createMemo(() => maxIndex() - minIndex() + 1);
  const totalDataHeight = createMemo(() => props.maxValue - props.minValue);

  const yStep = createMemo(() => props.height / totalDataHeight());
  const xStep = createMemo(() => props.width / totalDataWidth());

  const hover = createMemo(() => {
    const mouseX = props.mouseX;
    const x = Math.round((mouseX - props.x) / xStep());
    const y = props.points[x + props.startIndex];
    if (y == null || x < 0 || mouseX > props.x + props.width) {
      return { x: -1, y: -1, value: null };
    }

    return {
      x: props.x + x * xStep(),
      y: props.y + chartUtils.flipYAxes(y, props.maxValue) * yStep(),
      value: y,
      index: x + minIndex()
    };
  });

  return (
    <Dynamic
      component={props.children}
      mouseX={hover().x}
      mouseY={hover().y}
      mouseValue={hover().value}
      mouseIndex={hover().index}
    ></Dynamic>
  )
}

export function ChartMousePositionInPercentage(props) {
  asserts.assertTypeFunction(props.mouseX, "mouseX");
  asserts.assertTypeFunction(props.mouseY, "mouseY");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");
  asserts.assertTypeFunction(props.children, "children");


  const percentage = createMemo(() => {
    const {width, height, x, y} = props;
    const mouseX = props.mouseX() - x;
    const mouseY = props.mouseY() - y;

    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
      return {x: -1, y: -1};
    }

    return {
      x: mouseX / width,
      y: mouseY / height,
    };
  });

  return (
    <Dynamic
      component={props.children}
      mouseXPercentage={percentage().x}
      mouseYPercentage={percentage().y}
      {...props}
    ></Dynamic>
  )
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
      for (let x = split.startIndex + 1; x <= split.endIndex; x++) {
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
      {/* <text dominant-baseline="start" text-anchor="end" x={hover().x} y={props.parentY}>{numberUtils.truncDecimals(hover().index / 256, 2)}s</text> */}
      <text dominant-baseline="start" text-anchor="end" x={hover().x} y={props.parentY}>{hover().index}</text>
      <For each={paths()}>{(path, i) => (
        <path d={path} class="data" fill="none" stroke={props.splits[i()].disabled ? "grey" : props.splits[i()].color} />
      )}</For>
      <text dominant-baseline="middle" text-anchor="end" x={props.x - 2} y={hover().y}>{hover().value}</text>
    </>
  );
}

export function ChartPath(props) {
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");
  asserts.assertTypeNumber(props.startIndex, "startIndex");
  asserts.assertTypeNumber(props.endIndex, "endIndex");
  asserts.assertTypeNumber(props.maxValue, "maxValue");
  asserts.assertTypeNumber(props.minValue, "minValue");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeArray(props.splits, "splits");
  asserts.assert1DArrayOfNumbersOrEmptyArray(props.points, "points");

  const paths = createMemo(() => {
    const { x, y, startIndex, endIndex, maxValue, minValue, width, height, splits, points } = props;
    const totalDataWidth = (endIndex - startIndex);
    const totalDataHeight = maxValue - minValue;

    const yStep = height / totalDataHeight;
    const xStep = width / totalDataWidth;

    return splits.map(split => {
      if (props.flipped) {
        const paths = [`M ${x + (split.startIndex - startIndex) * xStep} ${y + chartUtils.flipYAxes(points[split.endIndex], maxValue) * yStep}`]
        for (let x2 = split.startIndex + 1; x2 <= split.endIndex; x2++) {
          const y2 = points[split.endIndex - (x2 - split.startIndex)];
          const flippedY = chartUtils.flipYAxes(y2, maxValue);
          paths.push(`L ${x + (x2 - startIndex) * xStep} ${y + flippedY * yStep}`);
        }
        return paths.join(" ");
      } else {
        const paths = [`M ${x + (split.startIndex - startIndex) * xStep} ${y + chartUtils.flipYAxes(points[split.startIndex], maxValue) * yStep}`]
        for (let x2 = split.startIndex + 1; x2 <= split.endIndex; x2++) {
          const y2 = points[x2];
          const flippedY = chartUtils.flipYAxes(y2, maxValue);
          paths.push(`L ${x + (x2 - startIndex) * xStep} ${y + flippedY * yStep}`);
        }
        return paths.join(" ");
      }

    });
  });

  return (
    <For each={paths()}>{(path, i) => (
      <path d={path} fill="none" stroke-width="2" stroke={props.stroke || (props.splits[i()].disabled ? "grey" : props.splits[i()].color)} />
    )}</For>
  );
}

export function ChartHoverToolTip(props) {
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.mouseXPercentage, "mouseXPercentage");
  asserts.assert2DArrayOfNumbersOrEmptyArray(props.listOfPoints, "listOfPoints");
  asserts.assertTypeArray(props.listOfSplits, "listOfSplits");

  props = mergeProps({ stroke: "black", "stroke-width": 1 }, props);

  const [$labels, storeLabels] = createStore([]);

  createRenderEffect(() => {
    const { listOfPoints, listOfSplits, mouseXPercentage, colors = [], height, maxValue, minValue } = props;
    if (mouseXPercentage === -1) {
      storeLabels(produce(labels => {
        labels.length = 0;
      }));
      return;
    }

    const delta = maxValue - minValue;

    const hoverPoints = [];
    for (let i = 0; i < listOfPoints.length; i++) {
      const points = listOfPoints[i];
      const splits = listOfSplits[i];
      const {startIndex, endIndex} = splits;
      const length = endIndex - startIndex;
      const index = startIndex + Math.round(mouseXPercentage * length);
      const value = points[index];

      if (value == null || index < startIndex || index > endIndex) {
        continue;
      }
      const y = chartUtils.flipYAxes((value - minValue) / delta * height, height);

      hoverPoints.push({ y: y + props.y, value, color: arrayUtils.atWithWrapping(colors, i) || "black"});
    }

    hoverPoints.sort((a, b) => (a.value - b.value));

    const stepSize = 15;
    const minHeight = props.y + (stepSize * (hoverPoints.length - 1));
    const maxHeight = props.y + props.height;
    let valueFloor = maxHeight;
    let deltaFloor = maxHeight;
    storeLabels(produce(labels => {
      labels.length = hoverPoints.length;

      for (let i = 0; i < hoverPoints.length; i++) {
        const hover = hoverPoints[i];
        const storeLabel = labels[i] ??= {};
        const step = i * stepSize;
        const y = Math.max(minHeight - step, Math.min(hover.y, valueFloor));
        valueFloor = y - stepSize;

        storeLabel.value = hover.value;
        storeLabel.color = hover.color;
        storeLabel.y = y;

        if (i !== hoverPoints.length - 1) {
          const nextHover = hoverPoints[i + 1];
          const deltaValue = nextHover.value - hover.value;
          const deltaPercentage = (deltaValue / nextHover.value) * 100;
          asserts.assertTruthy(nextHover.value >= hover.value);

          const deltaY = Math.max(minHeight - stepSize - step, Math.min(hover.y + (nextHover.y - hover.y) / 2, deltaFloor));
          deltaFloor = deltaY - stepSize;

          storeLabel.deltaValue = deltaValue;
          storeLabel.deltaPercentage = deltaPercentage;
          storeLabel.deltaY = deltaY;
        } else {
          delete storeLabel.deltaValue;
          delete storeLabel.deltaPercentage;
          delete storeLabel.deltaY;
        }
      }
    }));
  });

  return (
    <g data-chart-tool-tip>
      <For each={$labels}>{label => (
        <>
          <circle cx={props.x} cy={label.y ?? -100} r="3" fill={label.color} />
          <text dominant-baseline="middle" text-anchor="end" x={props.x - 5} y={label.y + 1}>{label.value.toFixed(3)}</text>
          <Show when={label.deltaPercentage}>
            <text
              stroke="white"
              stroke-width="3"
              paint-order="stroke"
              fill="black"
              font-size="14"
              dominant-baseline="middle"
              text-anchor={props.mouseXPercentage > 0.5 ? "end" : "start"}
              x={props.xWithPadding + props.width * props.mouseXPercentage + (-5 * numberUtils.trueToOneAndFalseToNegativeOne(props.mouseXPercentage > 0.5))}
              y={label?.deltaY + 1}>{label.deltaValue.toFixed(1)} {props.unit} ({label.deltaPercentage.toFixed(1)}%)
            </text>
          </Show>
        </>
      )}</For>
    </g>
  );
}


export function ChartErrorBands(props) {
  asserts.assert2DArray(props.points, "points");
  asserts.assertTypeArray(props.splits, "splits");
  asserts.assertTypeNumber(props.maxValue, "maxValue");
  asserts.assertTypeNumber(props.minValue, "minValue");
  asserts.assertTypeNumber(props.endIndex, "endIndex");
  asserts.assertTypeNumber(props.startIndex, "startIndex");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ fill: "#00000082", stroke: "black" }, props);
  const [local, _] = splitProps(props, ["fill", "stroke"]);

  const paths = createMemo(() => {
    const { maxValue, points, x, y } = props;
    const totalDataWidth = props.endIndex - props.startIndex;
    const totalDataHeight = maxValue - props.minValue;

    const yStep = props.height / totalDataHeight;
    const xStep = props.width / totalDataWidth;

    asserts.assertTruthy(points[0]?.length === points[1]?.length);

    return props.splits.map(split => {
      asserts.assertTruthy(split.endIndex < points[0].length, "endIndex is out of bounds");

      const paths = [`M ${x} ${y + chartUtils.flipYAxes(points[0][split.startIndex], maxValue) * yStep}`];
      for (let i = split.startIndex + 1; i <= split.endIndex; i++) {
        const flippedY = chartUtils.flipYAxes(points[0][i], maxValue);
        paths.push(`L ${x + (i - split.startIndex) * xStep} ${y + flippedY * yStep}`);
      }

      for (let i = split.endIndex; i >= split.startIndex; i--) {
        const flippedY = chartUtils.flipYAxes(points[1][i], maxValue);
        paths.push(`L ${x + (i - split.startIndex) * xStep} ${y + flippedY * yStep}`);
      }

      paths.push("Z");

      return paths.join(" ");
    });
  });

  return (
    <For each={paths()}>{path => (
      <path d={path} {...local} />
    )}</For>
  );
}

export function ChartXAxisCeil(props) {
  return (
    <ChartPadding {...props}>{area => (
      <Component {...props} {...area} />
    )}</ChartPadding>
  );

  function Component(props) {
    asserts.assertTypeNumber(props.startValue, "startValue");
    asserts.assertTypeNumber(props.endValue, "endValue");
    asserts.assertTypeNumber(props.width, "width");
    asserts.assertTypeNumber(props.height, "height");
    asserts.assertTypeNumber(props.x, "x");
    asserts.assertTypeNumber(props.y, "y");

    props = mergeProps({
      fill: "black",
      gap: 3,
      "font-size": 16
    }, props);

    const [local, _] = splitProps(props, ["fill", "stroke", "font-size"]);

    const labels = createMemo(() => {
      const { width, startValue, endValue } = props;
      const delta = endValue - startValue;
      const idealSegmentSize = 40;
      const idealSegment = Math.round(width / idealSegmentSize);
      const axisGap = delta / idealSegment;
      const gap = arrayUtils.findByMinDelta(labelIncrements, axisGap);

      const direction = startValue < endValue;
      const roundedStartValue = (direction ? Math.floor(startValue / gap) : Math.ceil(startValue / gap)) * gap;
      const roundedEndValue = (direction ? Math.ceil(endValue / gap) : Math.floor(endValue / gap)) * gap;
      const segments = Math.abs((roundedEndValue - roundedStartValue) / gap);

      const listOfLabels = [];
      for (let i = roundedStartValue; i <= roundedEndValue; i += gap) {
        listOfLabels.push(i);
      }
      for (let i = roundedStartValue; i >= roundedEndValue; i -= gap) {
        listOfLabels.push(i);
      }

      const roundedDelta = numberUtils.absDelta(roundedStartValue, roundedEndValue);

      return {
        values: listOfLabels,
        gap: width / Math.abs(segments),
        paddingLeft: (width / roundedDelta) * numberUtils.absDelta(roundedStartValue, startValue),
        paddingRight: (width / roundedDelta) * numberUtils.absDelta(roundedEndValue, endValue),
        paddingBottom: local["font-size"] * (64 / 48) + props.gap,
      }
    });

    return (
      <>
        <g data-x-axis>
          <For each={labels().values}>{(value, i) => (
            <>
              <line
                x1={props.x + labels().gap * i()}
                x2={props.x + labels().gap * i()}
                y1={props.y + props.height - labels().paddingBottom - 2}
                y2={props.y + props.height - labels().paddingBottom + 2}
                stroke="black"
              ></line>
              <text
                dominant-baseline="hanging"
                text-anchor="middle"
                x={props.x + labels().gap * i()}
                y={props.y + props.height - labels().paddingBottom + props.gap}
                {...local}
              >
                {numberUtils.truncDecimals(value, 1)}
              </text>
            </>
          )}</For>
        </g>
        <ChartPadding
          {...props}
          {...labels()}
        />
      </>
    );
  }
}

export function ChartXAxisFloor(props) {
  asserts.assertTypeNumber(props.startValue, "startValue");
  asserts.assertTypeNumber(props.endValue, "endValue");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({
    fill: "black",
    gap: 3,
    "font-size": 16
  }, props);


  const [local, _] = splitProps(props, ["fill", "stroke", "font-size"]);

  const idealSegmentSize = 40;

  const labels = createMemo(() => {
    const { width, startValue, endValue } = props;
    const initialDelta = numberUtils.absDelta(startValue, endValue);
    const idealSegmentCount = Math.round(width / idealSegmentSize);
    const rawLabelIncrementCount = initialDelta / idealSegmentCount;
    const closestLabelIncrementCount = arrayUtils.findByMinDelta(labelIncrements, rawLabelIncrementCount);

    const roundedStartValue = numberUtils.floorClosestToValue(startValue / closestLabelIncrementCount, endValue / closestLabelIncrementCount) * closestLabelIncrementCount;
    const roundedEndValue = numberUtils.floorClosestToValue(endValue / closestLabelIncrementCount, startValue / closestLabelIncrementCount) * closestLabelIncrementCount;
    const roundedDelta = numberUtils.absDelta(roundedStartValue, roundedEndValue);
    const labelSegmentCount = roundedDelta / closestLabelIncrementCount;

    const listOfLabels = [];
    for (let i = roundedStartValue; i <= roundedEndValue; i += closestLabelIncrementCount) {
      listOfLabels.push(i);
    }
    for (let i = roundedStartValue; i >= roundedEndValue; i -= closestLabelIncrementCount) {
      listOfLabels.push(i);
    }

    const labelWidth = (width / initialDelta) * roundedDelta;

    return {
      values: listOfLabels,
      gap: labelWidth / labelSegmentCount,
      paddingLeft: width * (numberUtils.absDelta(startValue, roundedStartValue) / initialDelta),
    }
  });

  return (
    <g data-x-axis>
      <For each={labels().values}>{(value, i) => (
        <>
          <line
            x1={labels().paddingLeft + props.x + labels().gap * i()}
            x2={labels().paddingLeft + props.x + labels().gap * i()}
            y1={props.y + props.height - 2}
            y2={props.y + props.height + 2}
            stroke="black"
          ></line>
          <text
            dominant-baseline="hanging"
            text-anchor="middle"
            x={labels().paddingLeft + props.x + labels().gap * i()}
            y={props.y + props.height + props.gap}
            {...local}
          >
            {numberUtils.truncDecimals(value, 1)}{props.unit}
          </text>
        </>
      )}</For>
    </g>
  );
}

export function ChartYAxisFloor(props) {
  asserts.assertTypeNumber(props.startValue, "startValue");
  asserts.assertTypeNumber(props.endValue, "endValue");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({
    fill: "black",
    decimals: 1,
    gap: 3,
    "font-size": 16
  }, props);


  const [local, _] = splitProps(props, ["fill", "stroke", "font-size"]);

  const idealSegmentSize = 30;

  const labels = createMemo(() => {
    const { height, startValue, endValue } = props;
    const initialDelta = numberUtils.absDelta(startValue, endValue);

    if (!initialDelta) {
      return {
        values: []
      };
    }

    const idealSegmentCount = Math.round(height / idealSegmentSize);
    const rawLabelIncrementCount = initialDelta / idealSegmentCount;
    const closestLabelIncrementCount = arrayUtils.findByMinDelta(labelIncrements, rawLabelIncrementCount);

    const roundedStartValue = numberUtils.floorClosestToValue(startValue / closestLabelIncrementCount, endValue / closestLabelIncrementCount) * closestLabelIncrementCount;
    const roundedEndValue = numberUtils.floorClosestToValue(endValue / closestLabelIncrementCount, startValue / closestLabelIncrementCount) * closestLabelIncrementCount;
    const roundedDelta = numberUtils.absDelta(roundedStartValue, roundedEndValue);
    const labelSegmentCount = roundedDelta / closestLabelIncrementCount;

    const listOfLabels = [];
    for (let i = roundedStartValue; i <= roundedEndValue; i += closestLabelIncrementCount) {
      listOfLabels.push(i);
    }
    for (let i = roundedStartValue; i >= roundedEndValue; i -= closestLabelIncrementCount) {
      listOfLabels.push(i);
    }

    const labelHeight = (height / initialDelta) * roundedDelta;

    return {
      values: listOfLabels,
      gap: labelHeight / labelSegmentCount,
      paddingTop: height * (numberUtils.absDelta(startValue, roundedStartValue) / initialDelta),
    }
  });

  return (
    <g data-y-axis>
      <For each={labels().values}>{(value, i) => (
        <>
          <text
            dominant-baseline="middle"
            text-anchor="start"
            x={props.x + props.width + 4}
            y={labels().paddingTop + props.y + labels().gap * i()}
            {...local}
          >
            {numberUtils.roundDecimals(value, props.decimals)}{props.unit}
          </text>
        </>
      )}</For>
    </g>
  );
}

export function ChartPadding(props) {
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeFunction(props.children, "children");

  const right = createMemo(() => props.paddingRight ?? props.paddingInline ?? props.padding ?? 0);
  const left = createMemo(() => props.paddingLeft ?? props.paddingInline ?? props.padding ?? 0);
  const top = createMemo(() => props.paddingTop ?? props.paddingBlock ?? props.padding ?? 0);
  const bottom = createMemo(() => props.paddingBottom ?? props.paddingBlock ?? props.padding ?? 0);

  const hasValues = () => right() || left() || top() || bottom();

  return (
    <>
      <Show when={debug && hasValues()}>
        <g data-debug-padding data-debug-name={props.name}>
          <Show when={top()}>
            <rect
              data-debug-padding-top
              x={props.x}
              y={props.y}
              width={props.width}
              height={top()}
              fill="color-mix(in oklab, oklch(79.2% 0.209 151.711) 20%, transparent)"
              outline="none"
            ></rect>
          </Show>
          <Show when={bottom()}>
            <rect
              data-debug-padding-bottom
              x={props.x}
              y={props.y + props.height - bottom()}
              width={props.width}
              height={bottom()}
              fill="color-mix(in oklab, oklch(79.2% 0.209 151.711) 20%, transparent)"
              outline="none"
            ></rect>
          </Show>
          <Show when={left()}>
            <rect
              data-debug-padding-left
              x={props.x}
              y={props.y + top()}
              width={left()}
              height={props.height - bottom() - top()}
              fill="color-mix(in oklab, oklch(79.2% 0.209 151.711) 20%, transparent)"
              outline="none"
            ></rect>
          </Show>
          <Show when={right()}>
            <rect
              data-debug-padding-right
              x={props.x + props.width - right()}
              y={props.y + top()}
              width={right()}
              height={props.height - bottom() - top()}
              fill="color-mix(in oklab, oklch(79.2% 0.209 151.711) 20%, transparent)"
              outline="none"
            ></rect>
          </Show>
          <rect
            data-debug-padding-inner-outline
            x={props.x + left()}
            y={props.y + top()}
            width={props.width - right() - left()}
            height={props.height - bottom() - top()}
            fill="none"
            stroke="color-mix(in oklab, oklch(71.2% 0.194 13.428) 50%, transparent)"
            stroke-width="1"
          ></rect>
        </g>
      </Show>
      <Dynamic
        component={props.children}
        x={props.x + left()}
        y={props.y + top()}
        width={props.width - right() - left()}
        height={props.height - bottom() - top()}
      />
    </>
  );
}
