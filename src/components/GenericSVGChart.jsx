import { batch, createMemo, createRenderEffect, createSignal } from "solid-js";
import { SVGChartContext } from "../providers";
import { chartUtils } from "../utils/utils";
import { asserts } from "../collections/collections";

export function GenericSVGChart(props) {
  asserts.assertTypeNumber(props.min, "min is not a number");
  asserts.assertTypeNumber(props.max, "max is not a number");
  asserts.assertTrue(props.dataIndex >= 0 && props.dataIndex <= 2, "dataIndex is not a number between 0-2");

  asserts.assertTrue(props.max >= 0, "Max on pienempi kuin 0. Saattaa aiheuttaa ongelmia keskiviivan piirrossa, jos max on pienempi kuin 0. Tutki asiaa ja tämän voi poistaa sitten");

  const [hoverX, setHoverX] = createSignal(-1);
  const [hoverY, setHoverY] = createSignal(-1);
  const [hoverValue, setHoverValue] = createSignal(null);

  const width = 800;
  const height = 200;
  const paddingBlock = 100;
  const paddingInline = 100;

  let totalDataWidth, totalDataHeight, xStep, yStep;

  createRenderEffect(() => {
    totalDataWidth = props.parsedCTM.data.length;
    totalDataHeight = props.max - props.min;
    yStep = (height - paddingBlock) / totalDataHeight;
    xStep = (width - paddingInline) / totalDataWidth;
  });

  const updateHoverCoords = e => {
    const x = Math.round((e.offsetX - paddingInline / 2) / xStep);
    const y = props.parsedCTM.data[x]?.[props.dataIndex];
    if (y == null) {
      clearHoverCoors();
      return;
    }

    batch(() => {
      setHoverY(paddingBlock / 2 + chartUtils.flipYAxes(y, props.max) * yStep);
      setHoverX(paddingInline / 2 + x * xStep);
      setHoverValue(y);
    });
  };

  const clearHoverCoors = () => {
    batch(() => {
      setHoverX(-1);
      setHoverY(-1);
      setHoverValue(null);
    });
  };

  const path = createMemo(() => {
    return props.parsedCTM.data.map((row, x) => {
      const y = row[props.dataIndex];
      const flippedY = chartUtils.flipYAxes(y, props.max);
      if (x === 0) {
        return `M ${paddingInline / 2 + x * xStep} ${paddingBlock / 2 + flippedY * yStep}`;
      }
      return `L ${paddingInline / 2 + x * xStep} ${paddingBlock / 2 + flippedY * yStep}`;
    }).join(" ");
  });

  const zeroLineY = createMemo(() => paddingBlock / 2 + chartUtils.flipYAxes(0, props.max) * yStep);

  return (
    <SVGChartContext.Provider value={{ parsedCTM: () => props.parsedCTM, min: () => props.min, max: () => props.max, hoverX, hoverY, hoverValue, paddingBlock, paddingInline, height, width }}>
      <svg width={width} height={height} onMouseLeave={clearHoverCoors} onMouseMove={updateHoverCoords}>
        <path d={path()} stroke="black" fill="none" />
        <line x1={paddingInline / 2} x2={width} y1={zeroLineY()} y2={zeroLineY()} stroke="gray" />
        <line x1={paddingInline / 2} x2={width} y1={hoverY()} y2={hoverY()} stroke="black" />
        <line x1={hoverX()} x2={hoverX()} y1={0} y2={height} stroke="black" />
        <Show when={hoverValue()}>
          <text dominant-baseline="middle" text-anchor="end" x={paddingInline / 2} y={hoverY()}>{hoverValue()}</text>
        </Show>
        {props.children}
      </svg>
    </SVGChartContext.Provider>
  );
}
