import { parsedFileData } from "../signals";
import { jsPDF } from "jspdf";
import { symmetryPercent } from "./numberUtils";
import autoTable from "jspdf-autotable";

function drawSymmetryBar(pdf, x, y, precentage) {
  const barWidth = 50;
  const barHeight = 3;
  const minVal = 50;
  const maxVal = 100;
  const value = parseFloat(precentage);

  const redWidth = ((90 - minVal) / (maxVal - minVal)) * barWidth;
  pdf.setFillColor(255, 180, 180);
  pdf.rect(x, y, redWidth, barHeight, "F");

  const greenWidth = ((maxVal - 90) / (maxVal - minVal)) * barWidth;
  pdf.setFillColor(180, 255, 180);
  pdf.rect(x + redWidth, y, greenWidth, barHeight, "F");

  const adjustedValue = Math.max(value, 50);
  const posX = x + ((adjustedValue - minVal) / (maxVal - minVal)) * barWidth;
  pdf.setDrawColor(0);
  pdf.line(posX, y - 1, posX, y + barHeight + 1);
  

  pdf.setFontSize(8);
  pdf.text(`${value}%`, x + barWidth + 5, y + barHeight - 1);

}

function groupByMeasurement(files) {
  const group = {};
  for (const f of files) {
    const name = f.rawObject.measurement.name;
    const side = f.rawObject.configuration.side[1];

    const cleanedName = name
      .replace(/\boikea\b/gi, "")
      .replace(/\bvasen\b/gi, "")
      .replace(/\bpolven\b/gi, "")
      .trim();

    if (!group[cleanedName]) group[cleanedName] = [];

    const existingLeg = group[cleanedName].findIndex((e) => e.side === side);
    if (existingLeg !== -1) {
      group[cleanedName][existingLeg] = { side, file: f.rawObject.analysis };
    } else {
      group[cleanedName].push({ side, file: f.rawObject.analysis });
    }
  }
  return group;
}

export function generatePDF() {
  const pdf = new jsPDF();
  pdf.setFontSize(11);
  const files = parsedFileData();
  const grouped = groupByMeasurement(files);
  const patientInfo = files[0].rawObject.session;

  pdf.line(10, 5, 200, 5, "S");

  pdf.text(`Nimi: ${patientInfo.subjectNameFirst} ${patientInfo.subjectName}`,10,10);
  pdf.text(`Syntymäpäivä: ${patientInfo.subjectBirth}`, 10, 15);
  pdf.text(`Paino: ${patientInfo.subjectWeight}`, 10, 20);
  pdf.text(`Pituus: ${patientInfo.subjectHeight}`, 10, 25);

  pdf.text(`Sukupuoli: ${patientInfo.subjectSex[1]}`, 70, 10);
  pdf.text(`leikattu jalka: ${patientInfo.involvedSide}`, 70, 15);

  pdf.text(`Testin päivämäärä: ${files[0].rawObject.measurement["date(dd/mm/yyyy)"]}`,140,10);
  pdf.text(`Loukkaantumiuspäivä: ${patientInfo.injuryDate}`, 140, 15);

  pdf.line(10, 27, 200, 27, "S");

  const pageHeight = pdf.internal.pageSize.height;
  const marginBottom = 10;

  let currentY = 35;
  for (const [name, test] of Object.entries(grouped)) {
    if (test.length !== 2) continue;

    const rightData = test.find((s) => s.side === "right").file;
    const leftData = test.find((s) => s.side === "left").file;

    const torqExtSymm = symmetryPercent(rightData[112], leftData[112]);
    const workExtSymm = symmetryPercent(rightData[212], leftData[212]);
    const extWork = symmetryPercent(rightData[203], leftData[203]);
    const torqFlexSymm = symmetryPercent(rightData[113], leftData[113]);
    const workFlexSymm = symmetryPercent(rightData[213], leftData[213]);
    const flexWork = symmetryPercent(rightData[204], leftData[204]);

    const estimatedHeight = 90;

    if (currentY + estimatedHeight > pageHeight - marginBottom) {
      pdf.addPage();
      currentY = 10; 
    }
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(name, 14, currentY);

    const rows = [
      ["Etureisi", "", "", ""],
      [
        "Huippuvääntö (Nm)",
        Math.abs(rightData[112]).toFixed(2),
        Math.abs(leftData[112]).toFixed(2),
        torqExtSymm,
      ],
      [
        "Kokonaistyö (J)",
        Math.abs(rightData[212]).toFixed(2),
        Math.abs(leftData[212]).toFixed(2),
        workExtSymm,
      ],
      [
        "Huippuvääntö / BW",
        Math.abs(rightData[203]).toFixed(2),
        Math.abs(leftData[203]).toFixed(2),
        extWork,
      ],
      ["Takareisi", "", "", ""],
      [
        "Huippuvääntö (Nm)",
        Math.abs(rightData[113]).toFixed(2),
        Math.abs(leftData[113]).toFixed(2),
        torqFlexSymm,
      ],
      [
        "Kokonaistyö (J)",
        Math.abs(rightData[213]).toFixed(2),
        Math.abs(leftData[213]).toFixed(2),
        workFlexSymm,
      ],
      [
        "Huippuvääntö / BW",
        Math.abs(rightData[204]).toFixed(2),
        Math.abs(leftData[204]).toFixed(2),
        flexWork,
      ],
      [
        "HQ-ratio (%)",
        symmetryPercent(rightData[212], rightData[213]),
        symmetryPercent(leftData[212], leftData[213]),
        "",
      ],
    ];

    autoTable(pdf, {
      startY: currentY + 5,
      head: [["", "Oikea", "Vasen", "Symmetria"]],
      body: rows,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 1 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
      tableWidth: 110,
      didParseCell: function (data) {
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
            if (val < 90) {
              data.cell.styles.textColor = [200, 0, 0];
            } else {
              data.cell.styles.textColor = [0, 150, 0];
            }
          }
        }
      },
    });

    let barY = currentY + 18;

    drawSymmetryBar(pdf, 130, barY, torqExtSymm);
    drawSymmetryBar(pdf, 130, barY + 5.5, workExtSymm);
    drawSymmetryBar(pdf, 130, barY + 11.05, extWork);

    drawSymmetryBar(pdf, 130, barY + 23.5, torqFlexSymm);
    drawSymmetryBar(pdf, 130, barY + 29, workFlexSymm);
    drawSymmetryBar(pdf, 130, barY + 35, flexWork);

    currentY = pdf.lastAutoTable.finalY + 10;
  }

  pdf.save("make.pdf");
}
