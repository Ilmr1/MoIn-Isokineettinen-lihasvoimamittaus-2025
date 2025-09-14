import { createResource, createSignal, mergeProps } from 'solid-js'
import './App.css'
import { CTMUtils, fileUtils, indexedDBUtils } from './utils/utils';
import { GenericSVGChart } from './components/GenericSVGChart.jsx';
import { ThreeCharts } from './components/ThreeCharts.jsx';
import { FileBrowser } from './components/FileBrowser.jsx';
import { parsedFileContext } from './providers.js';
import { AverageChart } from './components/AverageChart.jsx';


function App() {
  const [fileName, setFileName] = createSignal("CTM450.CTM");
  const [parsedFileData, setParsedFileData] = createSignal([]);
  
  const [ctmData] = createResource(fileName, async name => {
    const text = await fileUtils.fetchCTMFileWithName(name);
    const formatted = CTMUtils.parseTextToObject(text);

    console.log(formatted);

    return { text, formatted };
  });

  indexedDBUtils.openStore("file-handlers", "readwrite");

  return (
    <parsedFileContext.Provider value={{ parsedFileData, setParsedFileData }}>
      <AverageChart listOfParsedCTM={parsedFileData} />
      <For each={parsedFileData()}>{parsedData => (
        <>
          <ThreeCharts parsedCTM={parsedData.rawObject} />
          <br />
          {/* <GenericSVGChart title="Power" parsedCTM={ctmData().formatted} dataIndex={0} min={ctmData().formatted.minmax.minPower} max={ctmData().formatted.minmax.maxPower} /><br /> */}
          {/* <GenericSVGChart title="Speed" parsedCTM={ctmData().formatted} dataIndex={1} min={ctmData().formatted.minmax.minSpeed} max={ctmData().formatted.minmax.maxSpeed} /><br /> */}
          {/* <GenericSVGChart title="Angle" parsedCTM={ctmData().formatted} dataIndex={2} min={ctmData().formatted.minmax.minAngle} max={ctmData().formatted.minmax.maxAngle} /><br /> */}
          <button onClick={() => fileUtils.generateFileAndDownload(fileUtils.formatToCSV(ctmData().formatted.data, ["Kammen voima", "Kammen nopeus", "Kammen kulma"]), "data.csv", "csv")}>CSV</button>
          <button onClick={() => console.log(ctmData().formatted.data.map(row => row.map(val => val.toFixed(3)).join("\t")).join("\n"))}>txt</button>
          <br />
        </>
      )}</For>
      <FileBrowser />
      <pre>
        <code>{ctmData()?.text}</code>
      </pre>
    </parsedFileContext.Provider>
  )
}

export default App;
