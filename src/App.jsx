import { createResource } from 'solid-js'
import './App.css'

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
    rawObject[header] = data.replaceAll("\r", "").trim().split("\n").map(row => row.split("\t"));
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


const rawMeasurementToObject = rawMeasurement => {
  let measurementObject = {};
  for (let [key, ...values] of rawMeasurement) {
    if (values.length === 1) {
      measurementObject[key] = formatMeasurementValues(values[0]);
    } else {
      measurementObject[key] = values.map(formatMeasurementValues);
      }
    }
  return measurementObject;
};

const formatMeasurementValues = measurementValue => {
  if (!isNaN(measurementValue) && measurementValue.trim() !== ""){
    return Number(measurementValue);
  }
  
  /* Add date/time formatting if necessary */
  return measurementValue;
};
  



const formatRawCTMObject = rawObject => {
  rawObject.data = rawObject.data.map(arr => arr.map(parseFloat));

  rawObject.memo = cleanMemo(rawObject.memo.join("\n"));

  rawObject.session = Object.fromEntries(rawObject.session);

  rawObject.Measurement = rawMeasurementToObject(rawObject.Measurement);
  

  return rawObject;
}

function App() {
  const [ctmData] = createResource(async () => {
    const text = await CTMFileToRawText("CTM448.CTM");
    const object = CTMTextToRawObject(text);
    const formatted = formatRawCTMObject(object);

    console.log(formatted);
    return text;
  });

  return (
    <pre>
      <code>{ctmData()}</code>
    </pre>
  )
}

export default App;
