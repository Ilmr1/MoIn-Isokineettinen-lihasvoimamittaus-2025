import { asserts } from "../collections/collections";
import { numberUtils, stringUtils } from "./utils";

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


const generateCollection = (markersByIndex, points, skipZeros) => {
  const collection = {
    startIndex: markersByIndex.move1[0],
    endIndex: markersByIndex.move1.at(-1),
    splits: [],
  };
  for (let i = 0; i < markersByIndex.move1.length - 1; i++) {
    filterAndPush(markersByIndex.move1[i], markersByIndex.move2[i], "red");
    filterAndPush(markersByIndex.move2[i], markersByIndex.move1[i + 1], "blue");
  }

  function filterAndPush(start, end, color) {
    if (skipZeros) {
      for (let i = start; i < end; i++) {
        if (points[i + 2] === 0) {
          start++;
        } else break;
      }

      for (let i = end; i > start; i--) {
        if (points[i - 2] === 0) {
          end--;
        } else break;
      }
    }

    collection.splits.push({
      startIndex: start,
      endIndex: end,
      color
    });
  }

  return collection;
}

const createAverageSplitCollection = (splits) => {
  const collection = {
    startIndex: 0,
    splits: [],
  };

  splits.forEach(split => {
    const delta = split.endIndex - split.startIndex;
    collection.endIndex ??= delta;
    if (collection.endIndex < delta) {
      collection.endIndex = delta;
    }
  });

  collection.splits.push({
    color: splits[0].color,
    startIndex: collection.startIndex,
    endIndex: collection.endIndex,
  });

  return collection;
}

const getPointCollections = (markersByIndex, data) => {
  const powerCollection = createPointCollection(fillZerosToPower(markersByIndex, data.map(row => row[0])));
  return {
    power: powerCollection,
    speed: createPointCollection(data.map(row => row[1])),
    angle: createPointCollection(data.map(row => row[2])),
    averagePowerExt: createAveragePointCollection(markersByIndex.move2.map((m, i) => ([m, markersByIndex.move1[i + 1]])), powerCollection.points),
    averagePowerFlex: createAveragePointCollection(markersByIndex.move2.map((m, i) => ([markersByIndex.move1[i], m])), powerCollection.points),
  }
};

const createPointCollection = (points) => {
  const pointCollection = { points };

  for (const point of points) {
    pointCollection.maxValue ??= point;
    pointCollection.minValue ??= point;

    if (pointCollection.maxValue < point) {
      pointCollection.maxValue = point
    } else if (pointCollection.minValue > point) {
      pointCollection.minValue = point
    }
  }

  return pointCollection;
}

const createAveragePointCollection = (indecies, points) => {
  const averages = [];
  const collection = { points: averages };
  let count = 0;

  indecies.forEach(([start, end]) => {
    count++;
    for (let i = start; i < end; i++) {
      averages[i - start] ??= 0;
      averages[i - start] += points[i];
    }
  });

  for (let i = 0; i < averages.length; i++) {
    const average = numberUtils.truncDecimals(averages[i] / count, 3);
    averages[i] = average;
    collection.maxValue ??= average;
    collection.minValue ??= average;

    if (collection.maxValue < average) {
      collection.maxValue = average
    } else if (collection.minValue > average) {
      collection.minValue = average
    }
  }

  return collection;
}

const createSplitCollections = (markersByIndex, pointCollections) => {
  const powerCollection = generateCollection(markersByIndex, pointCollections.power.points, true);
  return {
    power: powerCollection,
    speed: generateCollection(markersByIndex, pointCollections.speed.points, false),
    angle: generateCollection(markersByIndex, pointCollections.angle.points, false),
    averagePowerFlex: createAverageSplitCollection(powerCollection.splits.filter(split => split.color === "blue")),
    averagePowerExt: createAverageSplitCollection(powerCollection.splits.filter(split => split.color === "red")),
  }
};

const fillZerosToPower = (markersByIndex, powerData) => {
  const delta = (i) => Math.abs(powerData[i] - powerData[i - 1]);

  const fillZerosBlue = (start, end) => {
    const half = Math.floor(start + (end - start) / 2);
    const goodDelta = delta(half);
    const diff = 0.208
    for (let i = end; i > start; i--) {
      const d = delta(i);
      if (Math.abs(d - goodDelta) > diff) {
        powerData[i] = 0;
      } else {
        break;
      }
    }
  }

  const fillZerosRed = (start, end) => {
    for (let i = end; i > start; i--) {
      if (powerData[i] < 0) {
        powerData[i] = 0;
      } else break;
    }
  }


  for (let i = 0; i <= markersByIndex.move1[0]; i++) {
    powerData[i] = 0;
  }

  for (let i = markersByIndex.move1.at(-1); i < powerData.length; i++) {
    powerData[i] = 0;
  }

  for (let i = 0; i < markersByIndex.move1.length - 1; i++) {
    fillZerosRed(markersByIndex.move1[i], markersByIndex.move2[i]);
    fillZerosBlue(markersByIndex.move2[i], markersByIndex.move1[i + 1]);
  }

  return powerData;
}

const formatRawCTMObject = rawObject => {
  const object = {};

  object.data = rawObject.data.map(arr => arr.map(parseFloat));
  object.markersByIndex = formatRawObjectText(rawObject["markers by index"]);
  object.pointCollections = getPointCollections(object.markersByIndex, object.data);
  object.splitCollections = createSplitCollections(object.markersByIndex, object.pointCollections);
  object.setUp = formatRawObjectText(rawObject.SetUp);

  object.memo = cleanMemo(rawObject.memo.join("\n"));
  object.session = formatRawObjectText(rawObject.session);
  object.measurement = formatRawObjectText(rawObject.Measurement);
  object.configuration = formatRawObjectText(rawObject.Configuration);
  object.filter = formatRawObjectText(rawObject.filter);
  object.systemStrings = formatRawObjectText(rawObject["system strings"]);

  console.log("main object", object.splitCollections.averagePowerExt);
  console.log("main object", object.pointCollections.averagePowerExt);

  return object
}

export const parseTextToObject = text => {
  const object = ctmTextToRawObject(text);
  const formatted = formatRawCTMObject(object);
  return formatted;
};

export const getLegSide = CTMdata => {
  asserts.assertTruthy(CTMdata, "CTM data is missing");
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
