import { parsedFileData } from "../signals";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { symmetryPercent, padTrucateDecimalsToLength } from "./numberUtils";
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

  const adjustedVal = Math.max(val, 50);
  const posX = x + ((adjustedVal - minVal) / (maxVal - minVal)) * barWidth;
  pdf.setDrawColor(0);
  pdf.line(posX, y - 1, posX, y + barHeight + 1);

  const icon = val >= 90 ? tickIcon : crossIcon;
  pdf.addImage(icon, "PNG", x + barWidth + 5, y - 1.5, 5.5, 5.5);
}

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

  const pageHeight = pdf.internal.pageSize.height;
  const marginBottom = 10;
  let y = 35;

  const getVal = (data, idx) => {
    if (!data || typeof data[idx] !== "number") return "–";
    return padTrucateDecimalsToLength(Math.abs(data[idx]), 3);
  };


  for (const { key, title } of TESTS) {
    const test = groups[key];
    if (!test) continue;

    const leftData = test.left;
    const rightData = test.right;
    if (!leftData && !rightData) continue;

    const torqExtSymm = leftData && rightData ? symmetryPercent(rightData[112], leftData[112]) : "–";
    const workExtSymm = leftData && rightData ? symmetryPercent(rightData[212], leftData[212]) : "–";
    const extWork = leftData && rightData ? symmetryPercent(rightData[203], leftData[203]) : "–";
    const torqFlexSymm = leftData && rightData ? symmetryPercent(rightData[113], leftData[113]) : "–";
    const workFlexSymm = leftData && rightData ? symmetryPercent(rightData[213], leftData[213]) : "–";
    const flexWork = leftData && rightData ? symmetryPercent(rightData[204], leftData[204]) : "–";

    if (y + 90 > pageHeight - marginBottom) {
      pdf.addPage();
      y = 10;
    }

    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(title, 14, y);

    const rows = [
      ["Etureisi", "", "", ""],
      ["Huippuvääntö (Nm)", getVal(rightData, 110), getVal(leftData, 110), torqExtSymm],
      ["Kokonaistyö (J)", getVal(rightData, 212), getVal(leftData, 212), workExtSymm],
      ["Huippuvääntö / BW", getVal(rightData, 203), getVal(leftData, 203), extWork],
      ["Takareisi", "", "", ""],
      ["Huippuvääntö (Nm)", getVal(rightData, 111), getVal(leftData, 111), torqFlexSymm],
      ["Kokonaistyö (J)", getVal(rightData, 213), getVal(leftData, 213), workFlexSymm],
      ["Huippuvääntö / BW", getVal(rightData, 204), getVal(leftData, 204), flexWork],
      [
        "HQ-ratio (%)",
        rightData ? symmetryPercent(rightData[212], rightData[213]) : "–",
        leftData ? symmetryPercent(leftData[212], leftData[213]) : "–",
        "",
      ],
    ];

    autoTable(pdf, {
      startY: y + 5,
      head: [["", "Oikea", "Vasen", "Symmetria"]],
      body: rows,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 1 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
      tableWidth: 110,
      didParseCell: (data) => {
        const cellText = data.cell.text[0]?.toLowerCase();
        if (
          data.section === "body" &&
          (cellText === "etureisi" || cellText === "takareisi")
        ) {
          data.cell.styles.fontSize = 10.5;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.halign = "left";
        }
        if (data.section === "body" && data.column.index === 3) {
          const val = parseFloat(data.cell.text[0]);
          if (!isNaN(val)) {
            data.cell.styles.textColor = val < 90 ? [200, 0, 0] : [0, 150, 0];
          }
        }
      },
    });

    if (leftData && rightData) {
      const barY = y + 18;
      drawSymmetryBar(pdf, 130, barY, torqExtSymm);
      drawSymmetryBar(pdf, 130, barY + 5.5, workExtSymm);
      drawSymmetryBar(pdf, 130, barY + 11, extWork);
      drawSymmetryBar(pdf, 130, barY + 23.5, torqFlexSymm);
      drawSymmetryBar(pdf, 130, barY + 29, workFlexSymm);
      drawSymmetryBar(pdf, 130, barY + 35, flexWork);
    }

    y = pdf.lastAutoTable.finalY + 10;
  }

  pdf.save("make.pdf");
}
