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
    push(rawObject.markersByIndex.move1[i], rawObject.markersByIndex.move2[i], "red");
    push(rawObject.markersByIndex.move2[i], rawObject.markersByIndex.move1[i + 1], "blue");
  }

  function push(start, end, color) {
    for(let i = start; i < end; i++) {
      if (rawObject.data[i + 2][0] === 0) {
        start++;
      } else break;
    }

    for(let i = end; i > start; i--) {
      if (rawObject.data[i - 2][0] === 0) {
        end--;
      } else break;
    }

    console.log(start, end, color);
    data.push({
      data: rawObject.data.slice(start, end),
      start: start,
      end: end,
      color
    });
  }

  return data;
}

const changedInAngle = (item, i, arr) => {
  const reference = 0.01;
  if (i === 0) return false;
  const halfway = Math.floor(arr.length / 2);
  const halfwayDelta = Math.abs(arr[halfway].row[2] - arr[halfway - 1].row[2]) - reference;
  return Math.abs(item.row[2] - arr[i - 1].row[2]) > halfwayDelta;
}

const formatRawCTMObject = rawObject => {
  const object = {};

  object.data = rawObject.data.map(arr => arr.map(parseFloat));
  object.markersByIndex = formatRawObjectText(rawObject["markers by index"]);
  object.setUp = formatRawObjectText(rawObject.SetUp);

  // for (let i = 0; i < 1341; i++) {
  //   object.data[i][0] = 0;
  // }
  //
  // for (let i = 1679; i < 1800; i++) {
  //   object.data[i][0] = 0;
  // }
  // const reference = 0.01;
  // for (let i = 0; i < object.data.length - 1; i++) {
  //   const delta = Math.abs(object.data[i][0] - object.data[i + 1][0]) + reference;
  //   if (delta > max) {
  //     object.data[i][0] = 0
  //   }
  // }
  const delta = (i) => Math.abs(object.data[i][2] - object.data[i + 1][2]);

  const fillZerosBlue = (start, end) => {
    const half = Math.floor(start + (end - start) / 2);
    const goodDelta = delta(half);
    const diff = 0.208
    for (let i = end; i > start; i--) {
      const d = delta(i);
      if (Math.abs(d - goodDelta) > diff) {
        object.data[i][0] = 0;
      } else {
        break;
      }
    }
  }

  const fillZerosRed = (start, end) => {
    for (let i = end; i > start; i--) {
      if (object.data[i][0] < 0) {
        object.data[i][0] = 0;
      } else break;
    }
  }

  const exponentialMovingAverage = (alpha) => {
    let y = object.data[0][0];

    for (let i = 1; i < object.data.length; i++) {
      let x = object.data[i][0];
      y = Math.trunc((y + alpha * (x - y)) * 1000) / 1000;
      object.data[i][0] = y;
    }
  }


  for (let i = 0; i <= object.markersByIndex.move1[0]; i++) {
    object.data[i][0] = 0;
  }

  for (let i = object.markersByIndex.move1.at(-1); i < object.data.length; i++) {
    object.data[i][0] = 0;
  }

  for (let i = 0; i < object.markersByIndex.move1.length - 1; i++) {
    fillZerosRed(object.markersByIndex.move1[i], object.markersByIndex.move2[i]);
    fillZerosBlue(object.markersByIndex.move2[i], object.markersByIndex.move1[i + 1]);
  }

  // exponentialMovingAverage(.4);

  // let diff = 4;
  // for (let smoothing = 1; smoothing < 30; smoothing += 1) {
  //   const clone = [...arr];
  //   let value = 0
  //   for (let i = 1200; i < 2000; i++) {
  //     let value = 0;
  //     for (let j = 0; j <= smoothing; j++) {
  //       value += arr[i - j];
  //     }
  //     // value += (clone[i] - value) / smoothing
  //     clone[i] = value / smoothing;
  //   }
  //
  //   if (diff > Math.abs(5.482 - clone[1341])) {
  //     diff = Math.abs(5.482 - clone[1341]);
  //   }
  //
  //   if (test(clone[1341], "5.482")) {
  //     console.log("Victory", smoothing);
  //     if (test(clone[1342], "11.226")) {
  //       // console.log("Victory", alpha);
  //     }
  //   }
  // }

  // for (let i = 20; i < object.data.length - 20; i++) {
  //   let value = 0;
  //   for (let j = 0; j <= 20; j++) {
  //     value += arr[i + j];
  //   }
  //   // value += (clone[i] - value) / smoothing
  //   object.data[i][0] = Math.round((value / 20) * 1000) / 1000;
  // }



  object.memo = cleanMemo(rawObject.memo.join("\n"));
  object.session = formatRawObjectText(rawObject.session);
  object.measurement = formatRawObjectText(rawObject.Measurement);
  object.configuration = formatRawObjectText(rawObject.Configuration);
  object.filter = formatRawObjectText(rawObject.filter);
  object.systemStrings = formatRawObjectText(rawObject["system strings"]);

  object.splitData = splitData(object);
  object.minmax = minmax(object);

  return object
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
