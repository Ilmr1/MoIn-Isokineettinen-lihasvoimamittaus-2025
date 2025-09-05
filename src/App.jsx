import { createResource, createSignal } from 'solid-js'
import './App.css'
import { fileUtils } from './utils/utils';
import { GenericSVGChart } from './components/GenericSVGChart.jsx';

const CTMFileToRawText = async fileName => {
  const response = await fetch("./" + fileName);
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder("ISO-8859-1");
  return decoder.decode(buffer);
}

const CTMTextToRawObject = text => {
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
  
  for (let [key, ...values] of rawObject) {
    if (values.length === 1) {
       formattedObject[key] = formatObjectValues(values[0]);
    } else {
      formattedObject[key] = values.map(formatObjectValues);
    }
  }
  return formattedObject;
};

const formatObjectValues = objectValue => {
  objectValue = objectValue.replace(',', '.');
  if (!isNaN(objectValue) && objectValue.trim() !== ""){
    return Number(objectValue);
  } 
  return objectValue;
};


const splitData = (rawObject) => {
  const move1 = [];
  const move2 = [];
  for (let i = 0; i < rawObject.markersByIndex["move 1"].length - 1; i++) {
    move1.push(rawObject.data.slice(rawObject.markersByIndex["move 1"][i], rawObject.markersByIndex["move 2"][i]));
    move2.push(rawObject.data.slice(rawObject.markersByIndex["move 2"][i], rawObject.markersByIndex["move 1"][i + 1]));
  }

  return { move1, move2 };
}


const formatRawCTMObject = rawObject => {
  rawObject.data = rawObject.data.map(arr => arr.map(parseFloat));
  rawObject.memo = cleanMemo(rawObject.memo.join("\n"));
  rawObject.session = formatRawObjectText(rawObject.session);
  rawObject.Measurement = formatRawObjectText(rawObject.Measurement);
  rawObject.Configuration = formatRawObjectText(rawObject.Configuration);
  rawObject.SetUp = formatRawObjectText(rawObject.SetUp);
  rawObject.filter = formatRawObjectText(rawObject.filter);
  rawObject.markersByIndex = formatRawObjectText(rawObject["markers by index"]);
  delete rawObject["markers by index"];
  rawObject.splitData = splitData(rawObject);
  rawObject["system strings"] = formatRawObjectText(rawObject["system strings"]);
  rawObject.minmax = {
    minPower: rawObject.data.reduce((acc, row) => Math.min(row[0], acc), Infinity),
    maxPower: rawObject.data.reduce((acc, row) => Math.max(row[0], acc), -Infinity),
    minSpeed: rawObject.data.reduce((acc, row) => Math.min(row[1], acc), Infinity),
    maxSpeed: rawObject.data.reduce((acc, row) => Math.max(row[1], acc), -Infinity),
    minAngle: rawObject.data.reduce((acc, row) => Math.min(row[2], acc), Infinity),
    maxAngle: rawObject.data.reduce((acc, row) => Math.max(row[2], acc), -Infinity),
  }

  return rawObject;
}

function App() {
  const [fileName, setFileName] = createSignal("CTM448.CTM");

  const [ctmData] = createResource(fileName, async name => {
    const text = await CTMFileToRawText(name);
    const object = CTMTextToRawObject(text);
    const formatted = formatRawCTMObject(object);

    console.log(formatted);

    return { text, formatted };
  });

  return (
    <>
      <button onClick={() => setFileName("CTM448-bad.CTM")}>CTM448-bad.CTM</button>
      <button onClick={() => setFileName("CTM448.CTM")}>CTM448.CTM</button>
      <button onClick={() => setFileName("CTM450.CTM")}>CTM450.CTM</button>
      <br />
      <Show when={ctmData()}>
        <GenericSVGChart title="Power" parsedCTM={ctmData().formatted} dataIndex={0} min={ctmData().formatted.minmax.minPower} max={ctmData().formatted.minmax.maxPower} /><br />
        <GenericSVGChart title="Speed" parsedCTM={ctmData().formatted} dataIndex={1} min={ctmData().formatted.minmax.minSpeed} max={ctmData().formatted.minmax.maxSpeed} /><br />
        <GenericSVGChart title="Angle" parsedCTM={ctmData().formatted} dataIndex={2} min={ctmData().formatted.minmax.minAngle} max={ctmData().formatted.minmax.maxAngle} /><br />
        <button onClick={() => fileUtils.generateFileAndDownload(fileUtils.formatToCSV(ctmData().formatted.data, ["Kammen voima", "Kammen nopeus", "Kammen kulma"]), "data.csv", "csv")}>CSV</button>
        <pre>
          <code>{ctmData()?.text}</code>
        </pre>
      </Show>
    </>
  )
}

export default App;
