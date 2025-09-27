import { createResource, createSignal, For } from 'solid-js'
import './App.css'
import { CTMUtils, fileUtils, indexedDBUtils, numberUtils } from './utils/utils';
import { GenericSVGChart } from './components/GenericSVGChart.jsx';
import { ThreeCharts } from './components/ThreeCharts.jsx';
import { FileBrowser } from './components/FileBrowser.jsx';
import { parsedFileContext } from './providers.js';
import { AverageChart } from './components/AverageChart.jsx';
import { Header } from './components/Header.jsx';
import { Sidebar } from './components/Sidebar.jsx';
//import { Files } from "./components/FilesPage"

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
      <div class="min-h-screen flex">
          <Sidebar className="bg-gray-600 shadow-md"/>
        <div class="flex-1">
          <main class="flex-1 p-4 md:p-6 overflow-auto space-y-6 max-w-5xl mx-auto ml-28">
            <FileBrowser />
            <AverageChart listOfParsedCTM={parsedFileData} />
            <For each={parsedFileData()}>{parsedData => (
              <>
                <ThreeCharts parsedCTM={parsedData.rawObject} />
                <br />
                {/* <GenericSVGChart title="Power" parsedCTM={ctmData().formatted} dataIndex={0} min={ctmData().formatted.minmax.minPower} max={ctmData().formatted.minmax.maxPower} /><br /> */}
                {/* <GenericSVGChart title="Speed" parsedCTM={ctmData().formatted} dataIndex={1} min={ctmData().formatted.minmax.minSpeed} max={ctmData().formatted.minmax.maxSpeed} /><br /> */}
                {/* <GenericSVGChart title="Angle" parsedCTM={ctmData().formatted} dataIndex={2} min={ctmData().formatted.minmax.minAngle} max={ctmData().formatted.minmax.maxAngle} /><br /> */}
                <button

                onClick={() => fileUtils.generateFileAndDownload(fileUtils.formatToCSV(ctmData().formatted.data, ["Kammen voima", "Kammen nopeus", "Kammen kulma"]), "data.csv", "csv")}>CSV</button>
                <button
                class="button_blue"
                onClick={() => console.log(ctmData().formatted.data.map(row => row.map(val => val.toFixed(3)).join("\t")).join("\n"))}>txt</button>
                <br />
                <ul>
                  <For each={Object.entries(parsedData.rawObject.repetitions).sort(([a], [b]) => a.localeCompare(b))}>{([key, values]) => (
                    <li>{key}:
                      <For each={values}>{value => (
                        <span class="mx-2">
                          <Switch fallback={numberUtils.truncDecimals(value, 2)}>
                            <Match when={key.startsWith("torquePeakPos")}>{numberUtils.truncDecimals(value, 2)}° </Match>
                            <Match when={key.startsWith("torquePeak")}>{numberUtils.truncDecimals(value, 2)}Nm </Match>
                            <Match when={key.startsWith("powerAvg")}>{numberUtils.truncDecimals(value, 2)}W </Match>
                            <Match when={key.startsWith("powerPeak")}>{numberUtils.truncDecimals(value, 2)}W </Match>
                            <Match when={key.startsWith("power")}>{numberUtils.truncDecimals(value, 2)} rad/s </Match>
                            <Match when={key.startsWith("work")}>{numberUtils.truncDecimals(value, 2)}J </Match>
                            <Match when={key.startsWith("speedPeakPos")}>{numberUtils.truncDecimals(value, 2)}° </Match>
                            <Match when={key.startsWith("speed")}>{numberUtils.truncDecimals(value, 2)} deg/s </Match>
                          </Switch>
                        </span>
                      )}</For>
                    </li>
                  )}</For>
                </ul>
              </>
            )}</For>
            {/* <pre> */}
            {/*   <code>{ctmData()?.text}</code> */}
            {/* </pre> */}
          </main>
        </div>
      </div>
    </parsedFileContext.Provider>
  )
}

export default App;
