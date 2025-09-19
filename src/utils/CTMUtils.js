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
  const angleCollection = createPointCollection(data.map(row => row[2]));
  const powerCollection = createPointCollection(lowpass11Hz(markersByIndex, fillZerosToPower(markersByIndex, data.map(row => row[0]), angleCollection.points)));
  const flexIndecis = markersByIndex.move2.map((m, i) => ([m, markersByIndex.move1[i + 1]]));
  const extIndecis = markersByIndex.move2.map((m, i) => ([markersByIndex.move1[i], m]));
  const averagePowerFlexCollection = createAveragePointCollection(flexIndecis, powerCollection.points);
  const averagePowerExtCollection = createAveragePointCollection(extIndecis, powerCollection.points);

  return {
    power: powerCollection,
    speed: createPointCollection(data.map(row => row[1])),
    angle: angleCollection,
    averagePowerFlex: averagePowerFlexCollection,
    averagePowerExt: averagePowerExtCollection,
    averagePowerFlexError: createAverageErrorPointCollection(flexIndecis, powerCollection.points, averagePowerFlexCollection.points, 1),
    averagePowerExtError: createAverageErrorPointCollection(extIndecis, powerCollection.points, averagePowerExtCollection.points, 1),
  }
};

// TODO: Change the chatGPT implementation :D
function createLowpass11Hz(sampleRate) {
  if (!sampleRate || sampleRate <= 0) throw new Error('sampleRate must be > 0');

  const fc = 11.0; // cutoff in Hz
  const omega = 2 * Math.PI * fc;
  const alpha = omega / (sampleRate + omega); // alpha = 2πfc / (fs + 2πfc)

  let y = 0.0; // filter state (previous output)
  let initialized = false;

  return {
    // process one sample (x). Returns filtered sample (y).
    process(x) {
      if (!initialized) {
        // initialize to first input to avoid startup transient
        y = x;
        initialized = true;
      } else {
        y = y + alpha * (x - y); // single-pole IIR
      }
      return y;
    },

    // optional: reset filter state (defaults to 0 or provided value)
    reset(value = 0.0) {
      y = value;
      initialized = value !== 0.0;
    },

    // expose alpha for diagnostics
    getAlpha() {
      return alpha;
    }
  };
}

const filterByStartEndAndPoints = (start, end, points) => {
  const filter = createLowpass11Hz(256);
  let highestPoint = Math.floor(start + (end - start) / 2);
  let max;
  for (let i = start; i < end; i++) {
    max ??= points[i];
    if (Math.abs(points[i]) > max) {
      max = Math.abs(points[i]);
      highestPoint = i;
    }
  }
  for (let i = start; i <= highestPoint; i++) {
    points[i] = numberUtils.truncDecimals(filter.process(points[i]), 3);
  }

  filter.reset(0);

  for (let i = end; i >= highestPoint; i--) {
    points[i] = numberUtils.truncDecimals(filter.process(points[i]), 3);
  }
}

const lowpass11Hz= (markersByIndex, points) => {
  for (let i = 0; i < markersByIndex.move1.length - 1; i++) {
    filterByStartEndAndPoints(markersByIndex.move1[i], markersByIndex.move2[i], points);
    filterByStartEndAndPoints(markersByIndex.move2[i], markersByIndex.move1[i + 1], points);
  }

  return points;
}

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

const createAverageErrorPointCollection = (indecies, points, averagePoints, errorPercentage) => {
  const highs = Array(averagePoints.length).fill(0);
  const lows = Array(averagePoints.length).fill(0);
  let minValue, maxValue;
  const collection = { points: [highs, lows] };

  indecies.forEach(([start, end]) => {
    for (let i = start; i < end; i++) {
      const delta = numberUtils.delta(points[i], averagePoints[i - start]);
      if (delta < 0) {
        lows[i - start] = Math.min(lows[i - start], delta);
      } else {
        highs[i - start] = Math.max(highs[i - start], delta);
      }
    }
  });

  asserts.assertTruthy(highs.length === lows.length, "Lengths miss match");
  asserts.assertTruthy(averagePoints.length === lows.length, "Lengths miss match");
  asserts.assertTruthy(errorPercentage >= 0 && errorPercentage <= 1, "Invalid error rate");

  for (let i = 0; i < averagePoints.length; i++) {
    asserts.assertTruthy(highs[i] >= 0);
    asserts.assertTruthy(lows[i] <= 0);
    highs[i] = numberUtils.truncDecimals(averagePoints[i] + highs[i] * errorPercentage, 3);
    lows[i] = numberUtils.truncDecimals(averagePoints[i] + lows[i] * errorPercentage, 3);
    minValue = numberUtils.min(minValue, lows[i]);
    maxValue = numberUtils.max(maxValue, highs[i]);
  }

  collection.minValue = minValue;
  collection.maxValue = maxValue;

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

const fillZerosToPower = (markersByIndex, powerData, angleData) => {
  const delta = (i) => Math.abs(angleData[i] - angleData[i - 1]);

  const fillZerosBlue = (start, end) => {
    const half = Math.floor(start + (end - start) / 2);
    const goodDelta = delta(half);
    const diff = 0.1
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
