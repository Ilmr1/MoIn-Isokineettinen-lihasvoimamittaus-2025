import { createResource, createSignal } from 'solid-js'
import './App.css'
import { CTMUtils, fileUtils, indexedDBUtils } from './utils/utils';
import { GenericSVGChart } from './components/GenericSVGChart.jsx';
import { ThreeCharts } from './components/ThreeCharts.jsx';
import { FileBrowser } from './components/FileBrowser.jsx';


function App() {
  const [fileName, setFileName] = createSignal("CTM448.CTM");
  
  const [ctmData] = createResource(fileName, async name => {
    const text = await fileUtils.fetchCTMFileWithName(name);
    const formatted = CTMUtils.parseTextToObject(text);

    console.log(formatted);

    return { text, formatted };
  });

  indexedDBUtils.openStore("file-handlers", "readwrite");

  return (
    <>
      <button onClick={() => setFileName("CTM448-bad.CTM")}>CTM448-bad.CTM</button>
      <button onClick={() => setFileName("CTM448.CTM")}>CTM448.CTM</button>
      <button onClick={() => setFileName("CTM450.CTM")}>CTM450.CTM</button>
      
      
      <br />
      <Show when={ctmData()}>
        <ThreeCharts parsedCTM={ctmData().formatted} />
        <br />
        {/* <GenericSVGChart title="Power" parsedCTM={ctmData().formatted} dataIndex={0} min={ctmData().formatted.minmax.minPower} max={ctmData().formatted.minmax.maxPower} /><br /> */}
        {/* <GenericSVGChart title="Speed" parsedCTM={ctmData().formatted} dataIndex={1} min={ctmData().formatted.minmax.minSpeed} max={ctmData().formatted.minmax.maxSpeed} /><br /> */}
        {/* <GenericSVGChart title="Angle" parsedCTM={ctmData().formatted} dataIndex={2} min={ctmData().formatted.minmax.minAngle} max={ctmData().formatted.minmax.maxAngle} /><br /> */}
        <button onClick={() => fileUtils.generateFileAndDownload(fileUtils.formatToCSV(ctmData().formatted.data, ["Kammen voima", "Kammen nopeus", "Kammen kulma"]), "data.csv", "csv")}>CSV</button>
        <FileBrowser />
        <pre>
          <code>{ctmData()?.text}</code>
        </pre>
      </Show>
    </>
  )
}

export default App;
