import {
  createMemo,
  createRenderEffect,
  mergeProps,
  splitProps,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
import { asserts } from "../collections/collections";
import { arrayUtils, chartUtils, numberUtils } from "../utils/utils";

const DEBUG = false;
// These are all the valid increments for the axis components
// So for example its not possible for the axis to increment using 3
// 3, 6, 9... should be impossible patter. This will also effect the axis starting value
// If increment is 5 every axis value has to be divisible by 5
const labelIncrements = [
  0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1, 2, 4, 5, 10, 20, 25, 40, 50, 100, 250,
  500,
];

// This file contains all the chart library components
// Each component is as minimal as possible and should just provide the needed svg element(s)
// You can stack these components to create a fully functional chart
// Each component should have asserts that will crash the component if initialized incorrectly
// The assert message can provide extra info about what a specific value is meant to be
//
// The idea behind every component is that you give x, y, width and height info that will be used to calculate the position
// This is done to make the math a lot more easier and modular, because now we can just calculate everything in relative coordinate space (between 0 - width)
// then we just add props.x and props.y to make the coordinate space absolute

export function ChartText(props) {
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  const localProps = createMemo(() => {
    if (props.position === "top") {
      return { "dominant-baseline": "ideographic", y: props.y };
    } else if (props.position === "bottom") {
      return { "dominant-baseline": "hanging", y: props.y + props.height };
    }
  });

  return (
    <text text-anchor="middle" x={props.x + props.width / 2} {...localProps()}>
      {props.title}
    </text>
  );
}

// Add vertical hover line using the mouseXPercentage prop
export function ChartPercentageVerticalLine(props) {
  asserts.assertTypeNumber(
    props.mouseXPercentage,
    "mouseXPercentage",
    "You can use ChartMousePositionInPercentage component to generate the mouse position",
  );
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

// Add horizontal line between min and max value by providing prop.value
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
    const { height, minValue, maxValue, value } = props;
    const delta = maxValue - minValue;
    const y = chartUtils.flipYAxes(
      ((value - minValue) / delta) * height,
      height,
    );
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
    <Show
      when={
        (props.minValue <= 0 && props.maxValue >= 0) ||
        (props.minValue >= 0 && props.maxValue <= 0)
      }
    >
      <ChartHorizontalLineFromValue value={0} stroke="grey" {...props} />
    </Show>
  );
}

// Add horizontal hover line using the mouseXPercentage prop and points
export function ChartHorizontalPointLineWithLabel(props) {
  asserts.assert1DArrayOfNumbersOrEmptyArray(props.points, "points");
  asserts.assertTypeNumber(props.endIndex, "endIndex");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.maxValue, "maxValue");
  asserts.assertTypeNumber(props.minValue, "minValue");
  asserts.assertTypeNumber(
    props.mouseXPercentage,
    "mouseXPercentage",
    "You can use ChartMousePositionInPercentage component to generate the mouse position",
  );
  asserts.assertTypeNumber(props.startIndex, "startIndex");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ stroke: "black", "stroke-width": 1 }, props);
  const [styles, _] = splitProps(props, ["stroke", "stroke-width"]);

  const hover = createMemo(() => {
    const {
      points,
      mouseXPercentage,
      startIndex,
      endIndex,
      height,
      maxValue,
      minValue,
    } = props;
    if (mouseXPercentage === -1) {
      return { y: -1, value: null };
    }

    const delta = maxValue - minValue;
    const length = endIndex - startIndex;
    const index = startIndex + Math.round(mouseXPercentage * length);
    const value = points[index];
    if (value == null || index < startIndex || index > endIndex) {
      return { y: -1, value: null };
    }

    const y = chartUtils.flipYAxes(
      ((value - minValue) / delta) * height,
      height,
    );

    return { y: y + props.y, value };
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
      <text
        dominant-baseline="middle"
        text-anchor="end"
        x={props.x - 5}
        y={hover().y}
      >
        {hover().value}
      </text>
    </>
  );
}

export function ChartHorizontalPointLine(props) {
  asserts.assert1DArrayOfNumbersOrEmptyArray(props.points, "points");
  asserts.assertTypeNumber(props.endIndex, "endIndex");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.maxValue, "maxValue");
  asserts.assertTypeNumber(props.minValue, "minValue");
  asserts.assertTypeNumber(
    props.mouseXPercentage,
    "mouseXPercentage",
    "You can use ChartMousePositionInPercentage component to generate the mouse position",
  );
  asserts.assertTypeNumber(props.startIndex, "startIndex");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ stroke: "black", "stroke-width": 1 }, props);
  const [styles, _] = splitProps(props, ["stroke", "stroke-width"]);

  const hover = createMemo(() => {
    const {
      points,
      mouseXPercentage,
      startIndex,
      endIndex,
      height,
      maxValue,
      minValue,
    } = props;
    if (mouseXPercentage === -1) {
      return { y: -1, value: null };
    }

    const delta = maxValue - minValue;
    const length = endIndex - startIndex;
    const index = startIndex + Math.round(mouseXPercentage * length);
    const value = points[index];
    if (value == null || index < startIndex || index > endIndex) {
      return { y: -1, value: null };
    }

    const y = chartUtils.flipYAxes(
      ((value - minValue) / delta) * height,
      height,
    );

    return { y: y + props.y, value };
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
  asserts.assertTypeNumber(
    props.mouseXPercentage,
    "mouseXPercentage",
    "You can use ChartMousePositionInPercentage component to generate the mouse position",
  );
  asserts.assertTypeNumber(props.startIndex, "startIndex");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps({ stroke: "black", "stroke-width": 1 }, props);
  const [styles, _] = splitProps(props, ["stroke", "stroke-width"]);

  const hover = createMemo(() => {
    const {
      points,
      mouseXPercentage,
      startIndex,
      endIndex,
      height,
      maxValue,
      minValue,
      split,
    } = props;
    if (mouseXPercentage === -1) {
      return { y: -1, value: null };
    }

    const delta = maxValue - minValue;
    const length = endIndex - startIndex;
    const index = startIndex + Math.round(mouseXPercentage * length);
    const value = points[index];
    if (value == null || index < split.startIndex || index > split.endIndex) {
      return { y: -1, value: null };
    }

    const y = chartUtils.flipYAxes(
      ((value - minValue) / delta) * height,
      height,
    );

    return { y: y + props.y, value };
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
      <text
        dominant-baseline="middle"
        text-anchor="end"
        x={props.x - 5}
        y={hover().y}
      >
        {hover().value}
      </text>
    </>
  );
}

export function ChartVecticalLinePercentageToRelativeIndex(props) {
  asserts.assert1DArrayOfNumbersOrEmptyArray(props.points, "points");
  asserts.assertTruthy(props.split, "split");
  asserts.assertTypeNumber(props.startIndex, "startIndex");
  asserts.assertTypeNumber(props.endIndex, "endIndex");
  asserts.assertTypeNumber(
    props.mouseXPercentage,
    "mouseXPercentage",
    "You can use ChartMousePositionInPercentage component to generate the mouse position",
  );
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

    const length = endIndex - startIndex;
    const index = startIndex + Math.round(mouseXPercentage * length);
    if (index < split.startIndex || index > split.endIndex) {
      return -1;
    }

    const splitLength = split.endIndex - split.startIndex;
    const percentage = (index - split.startIndex) / splitLength;

    if (props.flipped) {
      return (1 - percentage) * width;
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

  props = mergeProps(
    { fill: "none", stroke: "black", "stroke-width": 1 },
    props,
  );
  const [local, _] = splitProps(props, [
    "fill",
    "stroke",
    "width",
    "height",
    "x",
    "y",
    "stroke-width",
  ]);

  return <rect {...local} />;
}

export function ChartGrid(props) {
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps(
    {
      stroke: "black",
      "stroke-width": ".25",
      "stroke-dasharray": "2",
      fill: "none",
    },
    props,
  );
  const [local, _] = splitProps(props, [
    "fill",
    "stroke-width",
    "stroke-dasharray",
    "stroke",
  ]);

  const grid = createMemo(() => {
    const string = [];
    const height = props.height,
      width = props.width,
      x = props.x,
      y = props.y;
    for (let i = 0; i < height / 50; i++) {
      string.push(`M ${x} ${y + i * 50} l ${width} 0`);
    }
    for (let i = 0; i < width / 50; i++) {
      string.push(`M ${x + i * 50} ${y} l 0 ${height}`);
    }
    return string.join(" ");
  });

  return <path d={grid()} {...local} />;
}

export function ChartGridAlignedWithFloorXAxisLabels(props) {
  asserts.assertTypeNumber(props.startValue, "startValue");
  asserts.assertTypeNumber(props.endValue, "endValue");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps(
    {
      stroke: "black",
      "stroke-width": ".25",
      "stroke-dasharray": "2",
      fill: "none",
    },
    props,
  );
  const [local, _] = splitProps(props, [
    "fill",
    "stroke-width",
    "stroke-dasharray",
    "stroke",
  ]);

  const idealSegmentSize = 40;

  const grid = createMemo(() => {
    const { x, y, height, width, startValue, endValue } = props;
    const initialDelta = numberUtils.absDelta(startValue, endValue);
    const idealSegmentCount = Math.round(width / idealSegmentSize);
    const rawLabelIncrementCount = initialDelta / idealSegmentCount;
    const closestLabelIncrementCount = arrayUtils.findByMinDelta(
      labelIncrements,
      rawLabelIncrementCount,
    );

    const roundedStartValue =
      numberUtils.floorClosestToValue(
        startValue / closestLabelIncrementCount,
        endValue / closestLabelIncrementCount,
      ) * closestLabelIncrementCount;
    const roundedEndValue =
      numberUtils.floorClosestToValue(
        endValue / closestLabelIncrementCount,
        startValue / closestLabelIncrementCount,
      ) * closestLabelIncrementCount;
    const roundedDelta = numberUtils.absDelta(
      roundedStartValue,
      roundedEndValue,
    );
    const labelSegmentCount = roundedDelta / closestLabelIncrementCount;

    const labelWidth = (width / initialDelta) * roundedDelta;

    const start =
      width *
      (numberUtils.absDelta(startValue, roundedStartValue) / initialDelta);
    const step = labelWidth / labelSegmentCount;
    const string = [];

    for (let i = start; i < width; i += step) {
      string.push(`M ${x + i} ${y} l 0 ${height}`);
    }

    return string.join(" ");
  });

  return <path d={grid()} {...local} />;
}

export function ChartGridAlignedWithFloorYAxisLabels(props) {
  asserts.assertTypeNumber(props.startValue, "startValue");
  asserts.assertTypeNumber(props.endValue, "endValue");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");

  props = mergeProps(
    {
      stroke: "black",
      "stroke-width": ".25",
      "stroke-dasharray": "2",
      fill: "none",
    },
    props,
  );
  const [local, _] = splitProps(props, [
    "fill",
    "stroke-width",
    "stroke-dasharray",
    "stroke",
  ]);

  const idealSegmentSize = 30;

  const grid = createMemo(() => {
    const { x, y, height, width, startValue, endValue } = props;
    const initialDelta = numberUtils.absDelta(startValue, endValue);
    const idealSegmentCount = Math.round(height / idealSegmentSize);
    const rawLabelIncrementCount = initialDelta / idealSegmentCount;
    const closestLabelIncrementCount = arrayUtils.findByMinDelta(
      labelIncrements,
      rawLabelIncrementCount,
    );

    const roundedStartValue =
      numberUtils.floorClosestToValue(
        startValue / closestLabelIncrementCount,
        endValue / closestLabelIncrementCount,
      ) * closestLabelIncrementCount;
    const roundedEndValue =
      numberUtils.floorClosestToValue(
        endValue / closestLabelIncrementCount,
        startValue / closestLabelIncrementCount,
      ) * closestLabelIncrementCount;
    const roundedDelta = numberUtils.absDelta(
      roundedStartValue,
      roundedEndValue,
    );
    const labelSegmentCount = roundedDelta / closestLabelIncrementCount;

    const labelHeight = (height / initialDelta) * roundedDelta;

    const start =
      height *
      (numberUtils.absDelta(startValue, roundedStartValue) / initialDelta);
    const step = labelHeight / labelSegmentCount;
    const string = [];

    for (let i = start; i < height; i += step) {
      string.push(`M ${x} ${y + i} l ${width} 0`);
    }

    return string.join(" ");
  });

  return <path d={grid()} {...local} />;
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
    const { width, height, x, y } = props;
    const mouseX = props.mouseX() - x;
    const mouseY = props.mouseY() - y;

    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
      return { x: -1, y: -1 };
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
    const {
      x,
      y,
      startIndex,
      endIndex,
      maxValue,
      minValue,
      width,
      height,
      splits,
      points,
    } = props;
    const totalDataWidth = endIndex - startIndex;
    const totalDataHeight = maxValue - minValue;

    const yStep = height / totalDataHeight;
    const xStep = width / totalDataWidth;

    return splits.map((split) => {
      if (props.flipped) {
        const paths = [
          `M ${x + (split.startIndex - startIndex) * xStep} ${y + chartUtils.flipYAxes(points[split.endIndex], maxValue) * yStep}`,
        ];
        for (let x2 = split.startIndex + 1; x2 <= split.endIndex; x2++) {
          const y2 = points[split.endIndex - (x2 - split.startIndex)];
          const flippedY = chartUtils.flipYAxes(y2, maxValue);
          paths.push(
            `L ${x + (x2 - startIndex) * xStep} ${y + flippedY * yStep}`,
          );
        }
        return paths.join(" ");
      } else {
        const paths = [
          `M ${x + (split.startIndex - startIndex) * xStep} ${y + chartUtils.flipYAxes(points[split.startIndex], maxValue) * yStep}`,
        ];
        for (let x2 = split.startIndex + 1; x2 <= split.endIndex; x2++) {
          const y2 = points[x2];
          const flippedY = chartUtils.flipYAxes(y2, maxValue);
          paths.push(
            `L ${x + (x2 - startIndex) * xStep} ${y + flippedY * yStep}`,
          );
        }
        return paths.join(" ");
      }
    });
  });

  return (
    <For each={paths()}>
      {(path, i) => (
        <path
          d={path}
          fill="none"
          stroke-width="2"
          stroke={
            props.stroke ||
            (props.splits[i()].disabled ? "grey" : props.splits[i()].color)
          }
        />
      )}
    </For>
  );
}

export function ChartHoverToolTip(props) {
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeNumber(
    props.mouseXPercentage,
    "mouseXPercentage",
    "You can use ChartMousePositionInPercentage component to generate the mouse position",
  );
  asserts.assert2DArrayOfNumbersOrEmptyArray(
    props.listOfPoints,
    "listOfPoints",
  );
  asserts.assertTypeArray(props.listOfSplits, "listOfSplits");

  props = mergeProps({ stroke: "black", "stroke-width": 1 }, props);

  const [$labels, storeLabels] = createStore([]);

  createRenderEffect(() => {
    const {
      listOfPoints,
      listOfSplits,
      mouseXPercentage,
      colors = [],
      height,
      maxValue,
      minValue,
    } = props;
    if (mouseXPercentage === -1) {
      storeLabels(
        produce((labels) => {
          labels.length = 0;
        }),
      );
      return;
    }

    const delta = maxValue - minValue;

    const hoverPoints = [];
    for (let i = 0; i < listOfPoints.length; i++) {
      const points = listOfPoints[i];
      const splits = listOfSplits[i];
      const { startIndex, endIndex } = splits;
      const length = endIndex - startIndex;
      const index = startIndex + Math.round(mouseXPercentage * length);
      const value = points[index];

      if (value == null || index < startIndex || index > endIndex) {
        continue;
      }
      const y = chartUtils.flipYAxes(
        ((value - minValue) / delta) * height,
        height,
      );

      hoverPoints.push({
        y: y + props.y,
        value,
        color: arrayUtils.atWithWrapping(colors, i) || "black",
      });
    }

    hoverPoints.sort((a, b) => a.value - b.value);

    const stepSize = 15;
    const minHeight = props.y + stepSize * (hoverPoints.length - 1);
    const maxHeight = props.y + props.height;
    let valueFloor = maxHeight;
    let deltaFloor = maxHeight;
    storeLabels(
      produce((labels) => {
        labels.length = hoverPoints.length;

        for (let i = 0; i < hoverPoints.length; i++) {
          const hover = hoverPoints[i];
          const storeLabel = (labels[i] ??= {});
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

            const deltaY = Math.max(
              minHeight - stepSize - step,
              Math.min(hover.y + (nextHover.y - hover.y) / 2, deltaFloor),
            );
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
      }),
    );
  });

  return (
    <g data-chart-tool-tip>
      <For each={$labels}>
        {(label) => (
          <>
            <circle
              cx={props.x}
              cy={label.y ?? -100}
              r="3"
              fill={label.color}
            />
            <text
              dominant-baseline="middle"
              text-anchor="end"
              x={props.x - 5}
              y={label.y + 1}
            >
              {label.value.toFixed(3)}
            </text>
            <Show when={label.deltaPercentage}>
              <text
                stroke="white"
                stroke-width="3"
                paint-order="stroke"
                fill="black"
                font-size="14"
                dominant-baseline="middle"
                text-anchor={props.mouseXPercentage > 0.5 ? "end" : "start"}
                x={
                  props.xWithPadding +
                  props.width * props.mouseXPercentage +
                  -5 *
                    numberUtils.trueToOneAndFalseToNegativeOne(
                      props.mouseXPercentage > 0.5,
                    )
                }
                y={label?.deltaY + 1}
              >
                {label.deltaValue.toFixed(1)} {props.unit} (
                {label.deltaPercentage.toFixed(1)}%)
              </text>
            </Show>
          </>
        )}
      </For>
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

    return props.splits.map((split) => {
      asserts.assertTruthy(
        split.endIndex < points[0].length,
        "endIndex is out of bounds",
      );

      const paths = [
        `M ${x} ${y + chartUtils.flipYAxes(points[0][split.startIndex], maxValue) * yStep}`,
      ];
      for (let i = split.startIndex + 1; i <= split.endIndex; i++) {
        const flippedY = chartUtils.flipYAxes(points[0][i], maxValue);
        paths.push(
          `L ${x + (i - split.startIndex) * xStep} ${y + flippedY * yStep}`,
        );
      }

      for (let i = split.endIndex; i >= split.startIndex; i--) {
        const flippedY = chartUtils.flipYAxes(points[1][i], maxValue);
        paths.push(
          `L ${x + (i - split.startIndex) * xStep} ${y + flippedY * yStep}`,
        );
      }

      paths.push("Z");

      return paths.join(" ");
    });
  });

  return <For each={paths()}>{(path) => <path d={path} {...local} />}</For>;
}

export function ChartXAxisCeil(props) {
  return (
    <ChartPadding {...props}>
      {(area) => <Component {...props} {...area} />}
    </ChartPadding>
  );

  function Component(props) {
    asserts.assertTypeNumber(props.startValue, "startValue");
    asserts.assertTypeNumber(props.endValue, "endValue");
    asserts.assertTypeNumber(props.width, "width");
    asserts.assertTypeNumber(props.height, "height");
    asserts.assertTypeNumber(props.x, "x");
    asserts.assertTypeNumber(props.y, "y");

    props = mergeProps(
      {
        fill: "black",
        gap: 3,
        "font-size": 16,
      },
      props,
    );

    const [local, _] = splitProps(props, ["fill", "stroke", "font-size"]);

    const labels = createMemo(() => {
      const { width, startValue, endValue } = props;
      const delta = endValue - startValue;
      const idealSegmentSize = 40;
      const idealSegment = Math.round(width / idealSegmentSize);
      const axisGap = delta / idealSegment;
      const gap = arrayUtils.findByMinDelta(labelIncrements, axisGap);

      const direction = startValue < endValue;
      const roundedStartValue =
        (direction
          ? Math.floor(startValue / gap)
          : Math.ceil(startValue / gap)) * gap;
      const roundedEndValue =
        (direction ? Math.ceil(endValue / gap) : Math.floor(endValue / gap)) *
        gap;
      const segments = Math.abs((roundedEndValue - roundedStartValue) / gap);

      const listOfLabels = [];
      for (let i = roundedStartValue; i <= roundedEndValue; i += gap) {
        listOfLabels.push(i);
      }
      for (let i = roundedStartValue; i >= roundedEndValue; i -= gap) {
        listOfLabels.push(i);
      }

      const roundedDelta = numberUtils.absDelta(
        roundedStartValue,
        roundedEndValue,
      );

      return {
        values: listOfLabels,
        gap: width / Math.abs(segments),
        paddingLeft:
          (width / roundedDelta) *
          numberUtils.absDelta(roundedStartValue, startValue),
        paddingRight:
          (width / roundedDelta) *
          numberUtils.absDelta(roundedEndValue, endValue),
        paddingBottom: local["font-size"] * (64 / 48) + props.gap,
      };
    });

    return (
      <>
        <g data-x-axis>
          <For each={labels().values}>
            {(value, i) => (
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
                  y={
                    props.y + props.height - labels().paddingBottom + props.gap
                  }
                  {...local}
                >
                  {numberUtils.truncDecimals(value, 1)}
                </text>
              </>
            )}
          </For>
        </g>
        <ChartPadding {...props} {...labels()} />
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

  props = mergeProps(
    {
      fill: "black",
      gap: 3,
      "font-size": 16,
    },
    props,
  );

  const [local, _] = splitProps(props, ["fill", "stroke", "font-size"]);

  const idealSegmentSize = 40;

  const labels = createMemo(() => {
    const { width, startValue, endValue } = props;
    const initialDelta = numberUtils.absDelta(startValue, endValue);
    const idealSegmentCount = Math.round(width / idealSegmentSize);
    const rawLabelIncrementCount = initialDelta / idealSegmentCount;
    const closestLabelIncrementCount = arrayUtils.findByMinDelta(
      labelIncrements,
      rawLabelIncrementCount,
    );

    const roundedStartValue =
      numberUtils.floorClosestToValue(
        startValue / closestLabelIncrementCount,
        endValue / closestLabelIncrementCount,
      ) * closestLabelIncrementCount;
    const roundedEndValue =
      numberUtils.floorClosestToValue(
        endValue / closestLabelIncrementCount,
        startValue / closestLabelIncrementCount,
      ) * closestLabelIncrementCount;
    const roundedDelta = numberUtils.absDelta(
      roundedStartValue,
      roundedEndValue,
    );
    const labelSegmentCount = roundedDelta / closestLabelIncrementCount;

    const listOfLabels = [];
    for (
      let i = roundedStartValue;
      i <= roundedEndValue;
      i += closestLabelIncrementCount
    ) {
      listOfLabels.push(i);
    }
    for (
      let i = roundedStartValue;
      i >= roundedEndValue;
      i -= closestLabelIncrementCount
    ) {
      listOfLabels.push(i);
    }

    const labelWidth = (width / initialDelta) * roundedDelta;

    return {
      values: listOfLabels,
      gap: labelWidth / labelSegmentCount,
      paddingLeft:
        width *
        (numberUtils.absDelta(startValue, roundedStartValue) / initialDelta),
    };
  });

  return (
    <g data-x-axis>
      <For each={labels().values}>
        {(value, i) => (
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
              {numberUtils.truncDecimals(value, 1)}
              {props.unit}
            </text>
          </>
        )}
      </For>
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

  props = mergeProps(
    {
      fill: "black",
      decimals: 1,
      gap: 3,
      "font-size": 16,
    },
    props,
  );

  const [local, _] = splitProps(props, ["fill", "stroke", "font-size"]);

  const idealSegmentSize = 30;

  const labels = createMemo(() => {
    const { height, startValue, endValue } = props;
    const initialDelta = numberUtils.absDelta(startValue, endValue);

    if (!initialDelta) {
      return {
        values: [],
      };
    }

    const idealSegmentCount = Math.round(height / idealSegmentSize);
    const rawLabelIncrementCount = initialDelta / idealSegmentCount;
    const closestLabelIncrementCount = arrayUtils.findByMinDelta(
      labelIncrements,
      rawLabelIncrementCount,
    );

    const roundedStartValue =
      numberUtils.floorClosestToValue(
        startValue / closestLabelIncrementCount,
        endValue / closestLabelIncrementCount,
      ) * closestLabelIncrementCount;
    const roundedEndValue =
      numberUtils.floorClosestToValue(
        endValue / closestLabelIncrementCount,
        startValue / closestLabelIncrementCount,
      ) * closestLabelIncrementCount;
    const roundedDelta = numberUtils.absDelta(
      roundedStartValue,
      roundedEndValue,
    );
    const labelSegmentCount = roundedDelta / closestLabelIncrementCount;

    const listOfLabels = [];
    for (
      let i = roundedStartValue;
      i <= roundedEndValue;
      i += closestLabelIncrementCount
    ) {
      listOfLabels.push(i);
    }
    for (
      let i = roundedStartValue;
      i >= roundedEndValue;
      i -= closestLabelIncrementCount
    ) {
      listOfLabels.push(i);
    }

    const labelHeight = (height / initialDelta) * roundedDelta;

    return {
      values: listOfLabels,
      gap: labelHeight / labelSegmentCount,
      paddingTop:
        height *
        (numberUtils.absDelta(startValue, roundedStartValue) / initialDelta),
    };
  });

  return (
    <g data-y-axis>
      <For each={labels().values}>
        {(value, i) => (
          <>
            <text
              dominant-baseline="middle"
              text-anchor="start"
              x={props.x + props.width + 4}
              y={labels().paddingTop + props.y + labels().gap * i()}
              {...local}
            >
              {numberUtils.roundDecimals(value, props.decimals)}
              {props.unit}
            </text>
          </>
        )}
      </For>
    </g>
  );
}

export function ChartPadding(props) {
  asserts.assertTypeNumber(props.x, "x");
  asserts.assertTypeNumber(props.y, "y");
  asserts.assertTypeNumber(props.width, "width");
  asserts.assertTypeNumber(props.height, "height");
  asserts.assertTypeFunction(props.children, "children");

  const right = createMemo(
    () => props.paddingRight ?? props.paddingInline ?? props.padding ?? 0,
  );
  const left = createMemo(
    () => props.paddingLeft ?? props.paddingInline ?? props.padding ?? 0,
  );
  const top = createMemo(
    () => props.paddingTop ?? props.paddingBlock ?? props.padding ?? 0,
  );
  const bottom = createMemo(
    () => props.paddingBottom ?? props.paddingBlock ?? props.padding ?? 0,
  );

  const hasValues = () => right() || left() || top() || bottom();

  return (
    <>
      <Show when={DEBUG && hasValues()}>
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
