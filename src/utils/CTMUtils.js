import { asserts } from "../collections/collections";
import { arrayUtils, numberUtils, stringUtils } from "./utils";

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
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join(" ");
};


const createParsedSectionFromRawObjectSection = rawObjectSection => {
  let formattedObject = {};

  for (const [key, ...values] of rawObjectSection) {
    if (values.length === 1) {
       formattedObject[stringUtils.toCebabCase(key)] = numberUtils.parseIfNumber(values[0]);
    } else {
      formattedObject[stringUtils.toCebabCase(key)] = values.map(numberUtils.parseIfNumber);
    }
  }
  return formattedObject;
};


const createSplitCollection = (markersByIndex, points, moveMarkerToLastZeroValue, disabledList) => {
  const collection = {
    startIndex: markersByIndex.move1[0],
    endIndex: markersByIndex.move1.at(-1),
    splits: [],
  };

  for (let i = 0; i < markersByIndex.move1.length - 1; i++) {
    push(markersByIndex.move1[i], markersByIndex.move2[i], "red");
    push(markersByIndex.move2[i], markersByIndex.move1[i + 1], "blue");
  }

  function push(start, end, color) {
    const disabled = disabledList[collection.splits.length];
    if (moveMarkerToLastZeroValue) {
      for (let i = start; i < end; i++) {
        if (points[i + 1] === 0) {
          start++;
        } else break;
      }

      for (let i = end; i > start; i--) {
        if (points[i - 1] === 0) {
          end--;
        } else break;
      }
    }

    collection.splits.push({
      startIndex: start,
      endIndex: end,
      color,
      disabled: disabled ?? false,
    });
  }

  return collection;
}

const createAverageSplitCollection = (splits, color, disabledList) => {
  const collection = {
    startIndex: 0,
    endIndex: null,
    splits: [],
  };

  splits.forEach((split, i) => {
    if (split.color !== color || disabledList[i]) {
      return;
    }

    const delta = split.endIndex - split.startIndex;
    collection.endIndex ??= delta;
    if (collection.endIndex > delta) {
      collection.endIndex = delta;
    }
  });

  if (collection.endIndex) {
    collection.splits.push({
      color,
      startIndex: 0,
      endIndex: collection.endIndex,
    });
  }

  collection.endIndex ??= 0;

  return collection;
}

const createPointCollections = (markersByIndex, data, dataFiltering, disabledList) => {
  const angleCollection = createPointCollection(data.map(row => row[2]));
  let powerCollection;
  if (dataFiltering) {
    powerCollection = createPointCollection(lowpass11Hz(markersByIndex, fillZerosToPower(markersByIndex, data.map(row => row[0]), angleCollection.points)));
  } else {
    powerCollection = createPointCollection(data.map(row => row[0]));
  }

  const indecies = [];
  for (let i = 0; i < markersByIndex.move1.length - 1; i++) {
    pushIndecies(markersByIndex.move1[i], markersByIndex.move2[i], "red");
    pushIndecies(markersByIndex.move2[i], markersByIndex.move1[i + 1], "blue");
  }

  function pushIndecies(startIndex, endIndex, color) {
    indecies.push({
      color,
      disabled: disabledList[indecies.length] ?? false,
      startIndex,
      endIndex
    });
  }

  const averagePowerFlexCollection = createAveragePointCollection(indecies, "blue", powerCollection.points);
  const averagePowerExtCollection = createAveragePointCollection(indecies, "red", powerCollection.points);

  return {
    power: powerCollection,
    speed: createPointCollection(data.map(row => row[1])),
    angle: angleCollection,
    averagePowerFlex: averagePowerFlexCollection,
    averagePowerExt: averagePowerExtCollection,
    averagePowerFlexError: createAverageErrorPointCollection(indecies, "blue", powerCollection.points, averagePowerFlexCollection.points, 1),
    averagePowerExtError: createAverageErrorPointCollection(indecies, "red", powerCollection.points, averagePowerExtCollection.points, 1),
  }
};

function createLowpass11Hz(sampleRate) {
  asserts.assertFalsy(!sampleRate || sampleRate <= 0, "sampleRate must be > 0");

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

const createRepetitionsSection = (points, splits, sampleRate) => {
  
  const samplerate = sampleRate;
  const dt = 1 / samplerate;
  const resultsByColor = { red: [], blue: [] };

  splits.forEach(({ startIndex, endIndex, color }) => {
    let torqueExtreme = color === 'red' ? -Infinity : Infinity;
    let speedExtreme = color === 'red' ? -Infinity : Infinity;
    let work = 0;
    let powerSum = 0;
    let speedSum = 0;
    let powerPeak = -Infinity;
    let torquePeakAngle = 0;
    let speedPeakAngle = 0;
    let torquePeakIndex = startIndex;
    let speedPeakIndex = startIndex;
    let count = 0;

    const isRed = color === 'red';

    for (let i = startIndex; i < endIndex; i++) {
      const torque = points.power.points[i];
      const speed = points.speed.points[i];
      const angle = points.angle.points[i];
      const omega = numberUtils.toRad(speed);
      const power = torque * omega;

      powerSum += power;
      speedSum += speed;
      count++;
      if (power > powerPeak) powerPeak = power;

      if (i < endIndex - 1) {
        const tau0 = torque;
        const tau1 = points.power.points[i + 1];
        const theta0 = numberUtils.toRad(angle);
        const theta1 = numberUtils.toRad(points.angle.points[i + 1]);
        work += 0.5 * (tau0 + tau1) * (theta1 - theta0);
      }

      if (isRed ? torque > torqueExtreme : torque < torqueExtreme) {
        torqueExtreme = torque;
        torquePeakAngle = angle;
        torquePeakIndex = i;
      }
      if (isRed ? speed > speedExtreme : speed < speedExtreme) {
        speedExtreme = speed;
        speedPeakAngle = angle;
        speedPeakIndex = i;
      }
    }
    const timeToPeak = (torquePeakIndex - startIndex) * dt;
    const speedToPeak = (speedPeakIndex - startIndex) * dt;
    const startTime = startIndex * dt;

    resultsByColor[color].push({
      color,
      torqueExtreme,
      speedExtreme,
      work,
      powerPeak,
      powerAv: powerSum / count,
      speedAv: speedSum / count,
      torquePeakAngle,
      timeToPeak,
      speedToPeak,
      startTime,
      speedPeakAngle,
    });
  });
  return {
    torquePeak1: resultsByColor.red.map(r => r.torqueExtreme),
    torquePeak2: resultsByColor.blue.map(r => r.torqueExtreme),
    speedPeak1: resultsByColor.red.map(r => r.speedExtreme),
    speedPeak2: resultsByColor.blue.map(r => r.speedExtreme),
    work1: resultsByColor.red.map(r => r.work),
    work2: resultsByColor.blue.map(r => r.work),
    powerAvg1: resultsByColor.red.map(r => r.powerAv),
    powerAvg2: resultsByColor.blue.map(r => r.powerAv),
    speedAv1: resultsByColor.red.map(r => r.speedAv),
    speedAv2: resultsByColor.blue.map(r => r.speedAv),
    powerPeak1: resultsByColor.red.map(r => r.powerPeak),
    powerPeak2: resultsByColor.blue.map(r => r.powerPeak),
    torquePeakPos1: resultsByColor.red.map(r => r.torquePeakAngle),
    torquePeakPos2: resultsByColor.blue.map(r => r.torquePeakAngle),
    timeToPeak1: resultsByColor.red.map(r => r.timeToPeak),
    timeToPeak2: resultsByColor.blue.map(r => r.timeToPeak),
    speedToPeak1: resultsByColor.red.map(r => r.speedToPeak),
    speedToPeak2: resultsByColor.blue.map(r => r.speedToPeak),
    startTime1: resultsByColor.red.map(r => r.startTime),
    startTime2: resultsByColor.blue.map(r => r.startTime),
    speedPeakPos1: resultsByColor.red.map(r => r.speedPeakAngle),
    speedPeakPos2: resultsByColor.blue.map(r => r.speedPeakAngle),
  };
};
const createAnalysis = (repetitions, weight) => {
  return{
    110: arrayUtils.maxValue(repetitions.torquePeak1),
    111: arrayUtils.minValue(repetitions.torquePeak2),
    112: arrayUtils.average(repetitions.torquePeak1),
    113: arrayUtils.average(repetitions.torquePeak2),
    114: arrayUtils.average(repetitions.torquePeakPos1),
    115: arrayUtils.average(repetitions.torquePeakPos2),
    116: arrayUtils.average(repetitions.timeToPeak1),
    117: arrayUtils.average(repetitions.timeToPeak2),
    120: "TODO Torque aver. @ 0.20 sec Ext	Nm",
    121: "TODO Torque aver. @ 0.20 sec Flex	Nm",
    122: arrayUtils.average(repetitions.work1),
    123: arrayUtils.average(repetitions.work2),
    124: arrayUtils.average(repetitions.powerAvg1),
    125: arrayUtils.average(repetitions.powerAvg2),
    130: arrayUtils.linearSlope(repetitions.startTime1, repetitions.work1),
    131: arrayUtils.linearSlope(repetitions.startTime2, repetitions.work2),
    132: "TODO Expected Deviation Ext	%",
    133: "TODO Expected Deviation Flex	%",
    136: arrayUtils.maxValue(repetitions.speedPeak1),
    137: arrayUtils.maxValue(repetitions.speedPeak2),
    138: arrayUtils.average(repetitions.speedPeak1),
    139: arrayUtils.average(repetitions.speedPeak2),
    140: arrayUtils.average(repetitions.speedPeakPos1),
    141: arrayUtils.average(repetitions.speedPeakPos2),
    142: arrayUtils.average(repetitions.speedToPeak1),
    143: arrayUtils.average(repetitions.speedToPeak2),
    144: arrayUtils.average(repetitions.speedAv1),
    145: arrayUtils.average(repetitions.speedAv2),
    146: arrayUtils.maxValue(repetitions.powerPeak1),
    147: arrayUtils.maxValue(repetitions.powerPeak2),
    148: arrayUtils.average(repetitions.powerPeak1),
    149: arrayUtils.average(repetitions.powerPeak2),
    150: arrayUtils.average(repetitions.powerPeak1) / weight,
    151: arrayUtils.average(repetitions.powerPeak2) / weight,
    200: Math.abs((arrayUtils.average(repetitions.torquePeak2) / arrayUtils.average(repetitions.torquePeak1)) * 100),
    201: (arrayUtils.average(repetitions.work2) / arrayUtils.average(repetitions.work1)) * 100,
    202: (arrayUtils.average(repetitions.powerAvg2) / arrayUtils.average(repetitions.powerAvg1)) * 100,
    203: arrayUtils.average(repetitions.torquePeak1) / weight,
    204: arrayUtils.average(repetitions.torquePeak2) / weight,
    205: arrayUtils.average(repetitions.work1) / weight,
    206: arrayUtils.average(repetitions.work2) / weight,
    207: arrayUtils.average(repetitions.powerAvg1) / weight,
    208: arrayUtils.average(repetitions.powerAvg2) / weight,
    212: arrayUtils.sum(repetitions.work1),
    213: arrayUtils.sum(repetitions.work2),
    225: arrayUtils.sum(repetitions.work1) + arrayUtils.sum(repetitions.work2),
    226: (arrayUtils.average(repetitions.powerPeak2) / arrayUtils.average(repetitions.powerPeak1)) * 100,
    250: arrayUtils.stdDev(repetitions.torquePeak1),
    251: arrayUtils.stdDev(repetitions.torquePeak2),
    254: arrayUtils.stdDev(repetitions.work1),
    255: arrayUtils.stdDev(repetitions.work2),
    256: arrayUtils.stdDev(repetitions.powerAvg1),
    257: arrayUtils.stdDev(repetitions.powerAvg2),
    258: arrayUtils.stdDev(repetitions.powerPeak1),
    259: arrayUtils.stdDev(repetitions.powerPeak2),
    260: arrayUtils.coeffVar(repetitions.torquePeak1),
    261: arrayUtils.coeffVar(repetitions.torquePeak2),
    264: arrayUtils.coeffVar(repetitions.work1),
    265: arrayUtils.coeffVar(repetitions.work2),
    266: arrayUtils.coeffVar(repetitions.powerAvg1),
    267: arrayUtils.coeffVar(repetitions.powerAvg2),
    268: arrayUtils.coeffVar(repetitions.powerPeak1),
    269: arrayUtils.coeffVar(repetitions.powerPeak2),
  }
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

const createAveragePointCollection = (indecies, color, points) => {
  const averages = [];
  const collection = { points: averages };
  let count = 0;

  indecies.forEach(split => {
    if (split.disabled || split.color !== color) {
      return;
    }

    count++;
    for (let i = split.startIndex; i <= split.endIndex; i++) {
      averages[i - split.startIndex] ??= 0;
      averages[i - split.startIndex] += points[i];
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

const createAverageErrorPointCollection = (indecies, color, points, averagePoints, errorPercentage) => {
  const highs = Array(averagePoints.length).fill(0);
  const lows = Array(averagePoints.length).fill(0);
  let minValue, maxValue;
  const collection = { points: [highs, lows] };

  indecies.forEach(split => {
    if (split.disabled || split.color !== color) {
      return;
    }

    for (let i = split.startIndex; i < split.endIndex; i++) {
      const delta = numberUtils.delta(points[i], averagePoints[i - split.startIndex]);
      if (delta < 0) {
        lows[i - split.startIndex] = Math.min(lows[i - split.startIndex], delta);
      } else {
        highs[i - split.startIndex] = Math.max(highs[i - split.startIndex], delta);
      }
    }
  });

  asserts.assertTruthy(highs.length === lows.length, "Lengths miss match");
  asserts.assertTruthy(averagePoints.length === lows.length, "Lengths miss match");
  asserts.assertTruthy(errorPercentage >= 0 && errorPercentage <= 1, "Invalid error rate");

  for (let i = 0; i < averagePoints.length; i++) {
    highs[i] = numberUtils.truncDecimals(averagePoints[i] + highs[i] * errorPercentage, 3);
    lows[i] = numberUtils.truncDecimals(averagePoints[i] + lows[i] * errorPercentage, 3);
    minValue = numberUtils.min(minValue, lows[i]);
    maxValue = numberUtils.max(maxValue, highs[i]);
  }

  collection.minValue = minValue ?? 0;
  collection.maxValue = maxValue ?? 0;

  return collection;
}

const createSplitCollections = (markersByIndex, pointCollections, dataFiltering, disabledList) => {
  const powerCollection = createSplitCollection(markersByIndex, pointCollections.power.points, dataFiltering, disabledList);
  return {
    power: powerCollection,
    speed: createSplitCollection(markersByIndex, pointCollections.speed.points, false, disabledList),
    angle: createSplitCollection(markersByIndex, pointCollections.angle.points, false, disabledList),
    averagePowerFlex: createAverageSplitCollection(powerCollection.splits, "blue", disabledList),
    averagePowerExt: createAverageSplitCollection(powerCollection.splits, "red", disabledList),
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

const createProgramType = configuration => {
  let programType = "";
  if (configuration.program[1].startsWith("isokin. ballistinen")) {
    const [typeA, typeB] = configuration.program[1].substring(20).split("/");
    if (typeA === typeB) {
      programType += `${typeA} `
    } else {
      programType += `${typeA}/${typeB} `
    }
  } else {
    programType += `${configuration.program[1]} `;
  }


  const [speedA, speedB] = configuration.speed;
  if (speedA === speedB) {
    programType += `${speedA}`
  } else {
    programType += `${speedA}/${speedB}`
  }

  return programType;
}

const formatRawCTMObject = (rawObject, dataFiltering, disabledList) => {
  const object = {};

  object.data = rawObject.data.map(arr => arr.map(parseFloat));
  object.markersByIndex = createParsedSectionFromRawObjectSection(rawObject["markers by index"]);
  object.pointCollections = createPointCollections(object.markersByIndex, object.data, dataFiltering, disabledList);
  object.splitCollections = createSplitCollections(object.markersByIndex, object.pointCollections, dataFiltering, disabledList);
  object.setUp = createParsedSectionFromRawObjectSection(rawObject.SetUp);

  object.memo = cleanMemo(rawObject.memo.join("\n"));
  object.session = createParsedSectionFromRawObjectSection(rawObject.session);
  object.measurement = createParsedSectionFromRawObjectSection(rawObject.Measurement);
  object.configuration = createParsedSectionFromRawObjectSection(rawObject.Configuration);
  object.filter = createParsedSectionFromRawObjectSection(rawObject.filter);
  object.systemStrings = createParsedSectionFromRawObjectSection(rawObject["system strings"]);
  object.repetitions = createRepetitionsSection(object.pointCollections, object.splitCollections.power.splits, object.measurement.samplingrate[0]);
  object.analysis = createAnalysis(object.repetitions, object.session.subjectWeight);

  object.programType = createProgramType(object.configuration);

  return object
}

export const parseTextToObject = (text, dataFiltering, disabledList) => {
  const object = ctmTextToRawObject(text);
  const formatted = formatRawCTMObject(object, dataFiltering, disabledList);
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
