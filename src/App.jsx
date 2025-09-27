import { createSignal, For } from 'solid-js'
import './App.css'
import { fileUtils } from './utils/utils';
import { ThreeCharts } from './components/ThreeCharts.jsx';
import { FileBrowser } from './components/FileBrowser.jsx';
import { parsedFileContext } from './providers.js';
import { AverageChart } from './components/AverageChart.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Repetitions } from './components/Repetitions.jsx';

function App() {
  const [parsedFileData, setParsedFileData] = createSignal([]);

  const saveDataAsCSV = (data) => {
    const columns = ["Kammen voima", "Kammen nopeus", "Kammen kulma"];
    fileUtils.generateFileAndDownload(fileUtils.formatToCSV(data, columns), "data.csv", "csv");
  }

  const printDataAsTextToConsole = (data) => {
    console.log(data.map(row => row.map(val => val.toFixed(3)).join("\t")).join("\n"));
  }

  return (
    <parsedFileContext.Provider value={{ parsedFileData, setParsedFileData }}>
      <div class="min-h-screen flex">
          <Sidebar />

        <div class="flex-1 bg-white">
          <main class="flex-1 p-4 md:p-6 overflow-auto space-y-6 max-w-5xl mx-auto ml-28">
            <FileBrowser />
            <AverageChart listOfParsedCTM={parsedFileData} />
            <For each={parsedFileData()}>{parsedData => (
              <>
                <ThreeCharts parsedCTM={parsedData.rawObject} />
                <div>
                  <button onClick={() => saveDataAsCSV(parsedData.rawObject.data)}>CSV</button>
                  <button class="button_blue" onClick={() => printDataAsTextToConsole(parsedData.rawObject.data)}>txt</button>
                </div>
                <Repetitions repetitions={parsedData.rawObject.repetitions} />
              </>
            )}</For>
          </main>
        </div>
      </div>
    </parsedFileContext.Provider>
  )
}

export default App;
