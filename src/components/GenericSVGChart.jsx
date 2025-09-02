import { batch, createMemo, createRenderEffect, createSignal } from "solid-js";
import "./ForceChart.css";

export function GenericSVGChart(props) {
  const [hoverX, setHoverX] = createSignal(-1);
  const [hoverY, setHoverY] = createSignal(-1);
  const [hoverValue, setHoverValue] = createSignal(null);

  const width = 800;
  const height = 200;
  const paddingBlock = 100;
  const paddingInline = 100;

  const flipY = y => Math.abs(y - props.parsedCTM.minmax.maxPower);

  const updateHoverCoords = e => {
    const totalDataWidth = props.parsedCTM.data.length;
    const totalDataHeight = props.parsedCTM.minmax.maxPower - props.parsedCTM.minmax.minPower;
    const yStep = (height - paddingBlock) / totalDataHeight;
    const xStep = (width - paddingInline) / totalDataWidth;
    const x = Math.round((e.offsetX - paddingInline / 2) / xStep);

    const y = props.parsedCTM.data[x]?.[0];
    if (y == null) {
      batch(() => {
        setHoverX(-1);
        setHoverY(-1);
        setHoverValue(null);
      });

      return;
    }

    batch(() => {
      setHoverY(paddingBlock / 2 + flipY(y) * yStep);
      setHoverX(paddingInline / 2 + x * xStep);
      setHoverValue(y);
    });
  }

  const path = createMemo(() => {
    const totalDataWidth = props.parsedCTM.data.length;
    const totalDataHeight = props.parsedCTM.minmax.maxPower - props.parsedCTM.minmax.minPower;
    const xStep = (width - paddingInline) / totalDataWidth;
    const yStep = (height - paddingBlock) / totalDataHeight;

    return props.parsedCTM.data.map((row, x) => {
      const y = row[0];
      const flippedY = flipY(y);
      if (x === 0) {
        return `M ${paddingInline / 2 + x * xStep} ${paddingBlock / 2 + flippedY * yStep}`;
      }
      return `L ${paddingInline / 2 + x * xStep} ${paddingBlock / 2 + flippedY * yStep}`;
    }).join(" ");
  });

  const zeroLineY = createMemo(() => {
    const totalDataHeight = props.parsedCTM.minmax.maxPower - props.parsedCTM.minmax.minPower;
    const yStep = (height - paddingBlock) / totalDataHeight;

    return flipY(paddingBlock / 2 + flipY(0) * yStep)
  });


  return (
    <svg width={width} height={height} onMouseMove={updateHoverCoords}>
      <path d={path()} stroke="black" fill="none" />
      <line x1={paddingInline / 2} x2={width} y1={zeroLineY()} y2={zeroLineY()} stroke="gray" />
      <line x1={paddingInline / 2} x2={width} y1={hoverY()} y2={hoverY()} stroke="black" />
      <line x1={hoverX()} x2={hoverX()} y1={0} y2={height} stroke="black" />
      <Show when={hoverValue()}>
        <text dominant-baseline="middle" text-anchor="end" x={paddingInline / 2} y={hoverY()}>{hoverValue()}</text>
      </Show>
    </svg>
  );
}

// function test() {
//   return (
//     <>
//       <GenericSVG data={[1,2,3]}>
//         <Crosshair></Crosshair>
//         <MiddleLine color="red"></MiddleLine>
//         <XCoords></XCoords>
//       </GenericSVG>
//       <GenericSVG data={[1,2,3]}>
//         <MiddleLine color="green"></MiddleLine>
//         <Coords></Coords>
//       </GenericSVG>
//     </>
//   );
// }
