import { asserts } from "../collections/collections";
import { stringUtils } from "./utils";

const ctmTextToRawObject = text => {
  const sections = text.split(/\[(.*)\]/g);
  const rawObject = {}

  for (let i = 1; i < sections.length; i += 2) {
    const header = sections[i];
    const data = sections[i + 1];
    rawObject[header] = data.replaceAll("\r", "").trim().split("\n").map(row => row.trim().split("\t"));
  }

  return rawObject;
};

const cleanMemo = memoText => {
  return memoText
    .replace(/\r/g, '')
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join(" ");
};


const formatRawObjectText = rawObject => {
  let formattedObject = {};

  for (const [key, ...values] of rawObject) {
    if (values.length === 1) {
       formattedObject[stringUtils.toCebabCase(key)] = formatObjectValues(values[0]);
    } else {
      formattedObject[stringUtils.toCebabCase(key)] = values.map(formatObjectValues);
    }
  }
  return formattedObject;
};

const formatObjectValues = objectValue => {
  objectValue = objectValue.replace(',', '.');
  if (!isNaN(objectValue) && objectValue.trim() !== "") {
    return Number(objectValue);
  }
  return objectValue;
};

const splitData = (rawObject) => {
  const data = [];
  for (let i = 0; i < rawObject.markersByIndex.move1.length - 1; i++) {
    data.push({
      data: rawObject.data.slice(rawObject.markersByIndex.move1[i], rawObject.markersByIndex.move2[i] + 1),
      start: rawObject.markersByIndex.move1[i],
      end: rawObject.markersByIndex.move2[i],
      color: "red",
    });
    data.push({
      data: rawObject.data.slice(rawObject.markersByIndex.move2[i], rawObject.markersByIndex.move1[i + 1] + 1),
      start: rawObject.markersByIndex.move2[i],
      end: rawObject.markersByIndex.move1[i + 1],
      color: "blue",
    });
  }

  return data;
}

const formatRawCTMObject = rawObject => {
  const object = {};

  object.data = rawObject.data.map(arr => arr.map(parseFloat));
  object.memo = cleanMemo(rawObject.memo.join("\n"));
  object.session = formatRawObjectText(rawObject.session);
  object.measurement = formatRawObjectText(rawObject.Measurement);
  object.configuration = formatRawObjectText(rawObject.Configuration);
  object.setUp = formatRawObjectText(rawObject.SetUp);
  object.filter = formatRawObjectText(rawObject.filter);
  object.markersByIndex = formatRawObjectText(rawObject["markers by index"]);
  object.systemStrings = formatRawObjectText(rawObject["system strings"]);

  object.splitData = splitData(object);
  object.minmax = minmax(object);

  return object
}

const markersByIndex = ctmObject => {
  const markersByIndex = formatRawObjectText(ctmObject["markers by index"]);
  console.log(markersByIndex);
}


/**
 * Generate minmax object in O(n)
 * @param {Object} ctmObject
 * @param {Array<Array<Number>>} ctmObject.data
 * @param {Object} ctmObject.markersByIndex
 * @param {Array<Number>} ctmObject.markersByIndex.move1
 */
const minmax = ctmObject => {
  asserts.arrayNotEmpty(ctmObject.data);
  asserts.assert2DArray(ctmObject.data);
  asserts.assertTypeNumber(ctmObject.data[0][0]);

  let minPower = ctmObject.data[0][0], maxPower = ctmObject.data[0][0],
      minSpeed = ctmObject.data[0][1], maxSpeed = ctmObject.data[0][1],
      minAngle = ctmObject.data[0][2], maxAngle = ctmObject.data[0][2],
      minSplit = ctmObject.data[0][2], maxSplit = ctmObject.data[0][2];
  const minIndex = ctmObject.markersByIndex.move1[0],
        maxIndex = ctmObject.markersByIndex.move1.at(-1);

  ctmObject.data.forEach(row => {
    if      (row[0] < minPower) { minPower = row[0]; }
    else if (row[0] > maxPower) { maxPower = row[0]; }
    if      (row[1] < minSpeed) { minSpeed = row[1]; }
    else if (row[1] > maxSpeed) { maxSpeed = row[1]; }
    if      (row[2] < minAngle) { minAngle = row[2]; }
    else if (row[2] > maxAngle) { maxAngle = row[2]; }
  });

  return { minPower, maxPower, minSpeed, maxSpeed, minAngle, maxAngle, minIndex, maxIndex };
}

export const parseTextToObject = text => {
  const object = ctmTextToRawObject(text);
  const formatted = formatRawCTMObject(object);
  return formatted;
};

export const getLegSide = CTMdata => {
  asserts.assertTrue(CTMdata, "CTM data is missing");
  let side = CTMdata.Configuration.side.at(-1);
  if (side === "left" || side === "right") {
    return side;
  }

  asserts.unreachable("No side data found");
}

export const isLeftLeg = CTMdata => {
  return getLegSide(CTMdata) === "left";
}

export const isRightLeg = CTMdata => {
  return getLegSide(CTMdata) === "right";
}
