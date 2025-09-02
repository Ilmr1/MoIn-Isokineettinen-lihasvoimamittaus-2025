import { createRenderEffect, createSignal } from "solid-js";
import "./ForceChart.css";

export function AngleChart(props) {
  const chartCanvas = document.createElement("canvas");
  const chartCtx = chartCanvas.getContext("2d");
  const hoverCanvas = document.createElement("canvas");
  const hoverCtx = hoverCanvas.getContext("2d");

  const width = 800;
  const height = 200;
  const paddingBlock = 100;
  const paddingInline = 100;

  hoverCanvas.width = width;
  hoverCanvas.height = height;
  chartCanvas.width = width;
  chartCanvas.height = height;

  const flipY = y => Math.abs(y - props.parsedCTM.minmax.maxAngle);

  createRenderEffect(() => {
    chartCanvas.style.outline = "solid 1px black";
    chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);


    const totalDataWidth = props.parsedCTM.data.length;
    const totalDataHeight = props.parsedCTM.minmax.maxAngle - props.parsedCTM.minmax.minAngle;
    const xStep = (chartCanvas.width - paddingInline) / totalDataWidth;
    const yStep = (chartCanvas.height - paddingBlock) / totalDataHeight;


    chartCtx.beginPath();
    for (let x = 0; x < props.parsedCTM.data.length; x++) {
      const y = props.parsedCTM.data[x][2];
      const flippedY = flipY(y);
      chartCtx.lineTo(paddingInline / 2 + x * xStep, paddingBlock / 2 + flippedY * yStep);
    }

    chartCtx.lineWidth = 2;
    chartCtx.stroke();

    // Render 0 line
    chartCtx.beginPath();
    chartCtx.moveTo(0, paddingBlock / 2 + flipY(0) * yStep);
    chartCtx.lineTo(chartCanvas.width, paddingBlock / 2 + flipY(0) * yStep);
    chartCtx.lineWidth = 1;
    chartCtx.strokeStyle = "gray";
    chartCtx.stroke();
  });

  hoverCanvas.addEventListener("mousemove", e => {
    hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);

    const totalDataWidth = props.parsedCTM.data.length;
    const totalDataHeight = props.parsedCTM.minmax.maxAngle - props.parsedCTM.minmax.minAngle;
    const yStep = (chartCanvas.height - paddingBlock) / totalDataHeight;
    const xStep = (hoverCanvas.width - paddingInline) / totalDataWidth;
    const x = Math.round((e.layerX - paddingInline / 2) / xStep);

    const y = props.parsedCTM.data[x]?.[2];
    if (y == null) {
      console.log("Not found");
      return;
    }

    hoverCtx.beginPath();
    // Horizontal line
    hoverCtx.moveTo(paddingInline / 2, paddingBlock / 2 + flipY(y) * yStep);
    hoverCtx.lineTo(hoverCanvas.width, paddingBlock / 2 + flipY(y) * yStep);

    // Vectical line
    hoverCtx.moveTo(paddingInline / 2 + x * xStep, 0);
    hoverCtx.lineTo(paddingInline / 2 + x * xStep, hoverCanvas.height);
    hoverCtx.stroke();
    hoverCtx.textAlign = "right";
    hoverCtx.textBaseline = "middle";
    const textMoveLeft = 5;
    hoverCtx.fillText(y, paddingInline / 2 - textMoveLeft, paddingBlock / 2 + flipY(y) * yStep);
  });

  hoverCanvas.addEventListener("mouseleave", e => {
    hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
  });

  return (
    <div class="cp-canvas-container">
      {chartCanvas}
      {hoverCanvas}
    </div>
  );
}
