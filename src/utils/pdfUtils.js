import { parsedFileData } from "../signals";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { symmetryPercent, padRoundDecimalsToLength } from "./numberUtils";
import tickIcon from "../assets/icons/tick.png";
import crossIcon from "../assets/icons/delete.png";

function drawSymmetryBar(pdf, x, y, percentage) {
  const barWidth = 50;
  const barHeight = 3;
  const minVal = 50;
  const maxVal = 100;
  const val = parseFloat(percentage);

  const redWidth = ((90 - minVal) / (maxVal - minVal)) * barWidth;
  pdf.setFillColor(255, 180, 180);
  pdf.rect(x, y, redWidth, barHeight, "F");

  const greenWidth = ((maxVal - 90) / (maxVal - minVal)) * barWidth;
  pdf.setFillColor(180, 255, 180);
  pdf.rect(x + redWidth, y, greenWidth, barHeight, "F");

  const adjustedVal = Math.min(Math.max(val, 50), 100);
  const posX = x + ((adjustedVal - minVal) / (maxVal - minVal)) * barWidth;
  pdf.setDrawColor(0);
  pdf.line(posX, y - 1, posX, y + barHeight + 1);

  const icon = val >= 90 ? tickIcon : crossIcon;
  pdf.addImage(icon, "PNG", x + barWidth + 5, y - 1.5, 5.5, 5.5);
}

const getVal = (data, idx) => {
  if (!data || typeof data[idx] !== "number") return "–";
  return padRoundDecimalsToLength(Math.abs(data[idx]), 3);
};

export function generatePDF() {
  const pdf = new jsPDF();
  pdf.setFontSize(11);
  const files = parsedFileData();
  const patientInfo = files[0].rawObject.session;

  const TESTS = [
    {
      key: "kons60",
      title: "Maksimivoima",
      match: "oj/kouk 500 Nm isokin. ballistinen kons/kons 60/60",
    },
    {
      key: "kons240",
      title: "Nopeusvoima",
      match: "oj/kouk 500 Nm isokin. ballistinen kons/kons 240/240",
    },
    {
      key: "eks30",
      title: "Jarruttava voima",
      match: "oj/kouk 500 Nm isokin. ballistinen eks/eks 30/30",
    },
    {
      key: "kons180",
      title: "Kestovoima",
      match: "oj/kouk 500 Nm isokin. ballistinen kons/kons 180/180",
    },
  ];

  const operatedSide = patientInfo.involvedSide?.includes("vasen") ? "vasen" : patientInfo.involvedSide?.includes("oikea") ? "oikea" : null;
  const rightHeader = operatedSide === "oikea" ? "Oikea (L)" : "Oikea";
  const leftHeader = operatedSide === "vasen" ? "Vasen (L)" : "Vasen";

  const groups = {};
  for (const f of files) {
    const name = f.rawObject.measurement.name;
    const side = f.rawObject.configuration.side[1];
    const analysis = f.rawObject.analysis;

    for (const { key, match } of TESTS) {
      if (name.includes(match)) {
        groups[key] ??= {};
        groups[key][side] = analysis;
      }
    }
  }

  pdf.line(10, 5, 200, 5, "S");
  pdf.text(`Nimi: ${patientInfo.subjectNameFirst} ${patientInfo.subjectName}`, 10, 10);
  pdf.text(`Syntymäpäivä: ${patientInfo.subjectBirth}`, 10, 15);
  pdf.text(`Paino: ${patientInfo.subjectWeight}`, 10, 20);
  pdf.text(`Pituus: ${patientInfo.subjectHeight}`, 10, 25);
  pdf.text(`Sukupuoli: ${patientInfo.subjectSex[1]}`, 70, 10);
  pdf.text(`Leikattu jalka: ${patientInfo.involvedSide}`, 70, 15);
  pdf.text(
    `Testin päivämäärä: ${files[0].rawObject.measurement["date(dd/mm/yyyy)"]}`,
    140,
    10
  );
  pdf.text(`Loukkaantumispäivä: ${patientInfo.injuryDate}`, 140, 15);
  pdf.line(10, 27, 200, 27, "S");

  let y = 32;

  for (const { key, title } of TESTS) {
    const test = groups[key];
    if (!test) continue;

    const leftData = test.left;
    const rightData = test.right;
    if (!leftData && !rightData) continue;
    const isEks30 = key === "eks30";
    const extIdx = isEks30 ? 111 : 110;
    const flexIdx = isEks30 ? 110 : 111;

    const torqExtSymm = leftData && rightData ? symmetryPercent(rightData[extIdx], leftData[extIdx], patientInfo.involvedSide) : "–";
    const workExtSymm = leftData && rightData ? symmetryPercent(rightData[isEks30 ? 213 : 212], leftData[isEks30 ? 213 : 212], operatedSide) : "–";
    const extWork = leftData && rightData ? symmetryPercent(rightData[isEks30 ? 204 : 203], leftData[isEks30 ? 204 : 203], operatedSide) : "–";

    const torqFlexSymm = leftData && rightData ? symmetryPercent(rightData[flexIdx], leftData[flexIdx], operatedSide) : "–";
    const workFlexSymm = leftData && rightData ? symmetryPercent(rightData[isEks30 ? 212 : 213], leftData[isEks30 ? 212 : 213], operatedSide) : "–";
    const flexWork = leftData && rightData ? symmetryPercent(rightData[isEks30 ? 203 : 204], leftData[isEks30 ? 203 : 204], operatedSide) : "–";

    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(title, 14, y);

    const rows = [
      ["Etureisi", "", "", ""],
      ["Huippuvääntö (Nm)", getVal(rightData, extIdx), getVal(leftData, extIdx), torqExtSymm],
      ["Kokonaistyö (J)", getVal(rightData, isEks30 ? 213 : 212), getVal(leftData, isEks30 ? 213 : 212), workExtSymm],
      ["Huippuvääntö / BW", getVal(rightData, isEks30 ? 204 : 203), getVal(leftData, isEks30 ? 204 : 203), extWork],
      ["Takareisi", "", "", ""],
      ["Huippuvääntö (Nm)", getVal(rightData, flexIdx), getVal(leftData, flexIdx), torqFlexSymm],
      ["Kokonaistyö (J)", getVal(rightData, isEks30 ? 212 : 213), getVal(leftData, isEks30 ? 212 : 213), workFlexSymm],
      ["Huippuvääntö / BW", getVal(rightData, isEks30 ? 203 : 204), getVal(leftData, isEks30 ? 203 : 204), flexWork],
      [
        "HQ-ratio (%)",
        rightData ? symmetryPercent(rightData[212], rightData[213]) : "–",
        leftData ? symmetryPercent(leftData[212], leftData[213]) : "–",
        "",
      ],
    ];

    autoTable(pdf, {
      startY: y +2,
      head: [["", rightHeader, leftHeader, "Symmetria %"]],
      body: rows,
      theme: "striped",
      styles: { fontSize: 8.5, cellPadding: 0.6, minCellHeight: 4.5 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 ,fontSize: 8.5,},
      tableWidth: 110,
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          const val = parseFloat(data.cell.text[0]);
          if (!isNaN(val)) {
            data.cell.styles.textColor = val < 90 ? [200, 0, 0] : [0, 150, 0];
          }
        }
      },
    });

    if (leftData && rightData) {
      const barY = y + 12.2;
      drawSymmetryBar(pdf, 130, barY, torqExtSymm);
      drawSymmetryBar(pdf, 130, barY + 4.8, workExtSymm);
      drawSymmetryBar(pdf, 130, barY + 9.6, extWork);
      drawSymmetryBar(pdf, 130, barY + 18.8, torqFlexSymm);
      drawSymmetryBar(pdf, 130, barY + 23.6, workFlexSymm);
      drawSymmetryBar(pdf, 130, barY + 28.5, flexWork);
    }

    y = pdf.lastAutoTable.finalY + 5;
  }
  const kons240 = groups["kons240"];
  const eks30 = groups["eks30"];
  if (kons240 && eks30){

    const leftData = {
      ext240: kons240.left?.[110],
      flex30: eks30.left?.[111],
    };
    const rightData = {
      ext240: kons240.right?.[110],
      flex30: eks30.right?.[111],
    };

    const hasLeft = leftData.ext240 != null && leftData.flex30 != null;
    const hasRight = rightData.ext240 != null && rightData.flex30 != null;

    const mixedLeft  = hasLeft  ? (leftData.flex30  / leftData.ext240)  * 100 : "–";
    const mixedRight = hasRight ? (rightData.flex30 / rightData.ext240) * 100 : "–";

    const mixedSymm = hasLeft && hasRight? symmetryPercent(mixedRight, mixedLeft, operatedSide): "–";


    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(12);

    const mixedRows = [
      ["Mixed Ratio (%)      ",
        hasRight ? padRoundDecimalsToLength(mixedRight, 3): "–",
        hasLeft ? padRoundDecimalsToLength(mixedLeft, 3) : "–",
        mixedSymm],
    ];


    autoTable(pdf, {
      startY: y + 5,
      head: [["", rightHeader, leftHeader, "Symmetria %"]],
      body: mixedRows,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 1 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
      tableWidth: 110,
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3){
          const val = parseFloat(data.cell.text[0]);
          if (!isNaN(val)){
            data.cell.styles.textColor = val < 90 ? [200, 0, 0] : [0, 150, 0];
          }
        }
      },
    });
    const barY = pdf.lastAutoTable.finalY - 5;
    if (!isNaN(parseFloat(mixedSymm))) {
      drawSymmetryBar(pdf, 130, barY, mixedSymm);
    }
  }
  pdf.save("make.pdf");
}
