import { createSignal, createMemo, For, Show, Suspense, lazy } from "solid-js";
import { Tabs } from "@kobalte/core";
import { fileUtils } from "../utils/utils.js";
import { FileBrowser } from "./FileBrowser.jsx";
import { AverageChart } from "./AverageChart.jsx";
import { ThreeCharts } from "./ThreeCharts.jsx"; // keep eager if light; otherwise lazy
import { Repetitions } from "./Repetitions.jsx";
import { parsedFileContext } from "../providers.js";
import { BarChart } from "./BarChart.jsx";

export function FileManager() {
  const [parsedFileData, setParsedFileData] = createSignal([]);

  const saveDataAsCSV = (data) => {
    const columns = ["Kammen voima", "Kammen nopeus", "Kammen kulma"];
    fileUtils.generateFileAndDownload(fileUtils.formatToCSV(data, columns), "data.csv", "csv");
  }

  const printDataAsTextToConsole = (data) => {
    console.log(data.map(row => row.map(val => val.toFixed(3)).join("\t")).join("\n"));
  }

  return (
    <div class="w-full h-full bg-gray-100 pt-4 pr-4 overflow-auto">
      <Tabs.Root defaultValue="files" class="w-full h-full flex flex-col">

        <Tabs.List class="bg-gray-200 p-4 flex flex-wrap min-h-10 gap-2 w-full">
          <Tabs.Trigger value="files" class="tab-trigger">
            Files
          </Tabs.Trigger>
          <Tabs.Trigger value="analysis" class="tab-trigger">
            Analysis
          </Tabs.Trigger>
          <Tabs.Trigger value="measurement" class="tab-trigger">
            Measurement
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="files" class="bg-white rounded-lg flex-1 overflow-auto">
          <parsedFileContext.Provider value={{ parsedFileData, setParsedFileData }}>
            <div class="w-full h-full space-y-6 grid place-items-center items-start">
              <FileBrowser />
              <AverageChart listOfParsedCTM={parsedFileData} />
              <div class="grid grid-cols-3 gap-2">
                <BarChart listOfParsedCTM={parsedFileData} title="Torque max" analysisExtKey="110" analysisFlexKey="111" />
                <BarChart listOfParsedCTM={parsedFileData} title="Torque max avearge" analysisExtKey="112" analysisFlexKey="113" />
                <BarChart listOfParsedCTM={parsedFileData} title="Torque max aver." analysisExtKey="203" analysisFlexKey="204" />
                <BarChart listOfParsedCTM={parsedFileData} title="Time aver. to peak Torque Ext" analysisExtKey="116" analysisFlexKey="117" />
                <BarChart listOfParsedCTM={parsedFileData} title="Position aver. @ peak Torque" analysisExtKey="114" analysisFlexKey="115" />
              </div>
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
            </div>
          </parsedFileContext.Provider>
        </Tabs.Content>

        <Tabs.Content value="analysis" class="bg-white rounded-lg p-6 shadow-sm">
          <p class="text-sm text-gray-600">Analysis view placeholder.</p>
        </Tabs.Content>

        <Tabs.Content value="measurement" class="bg-white rounded-lg p-6 shadow-sm">
          <p class="text-sm text-gray-600">Measurement view placeholder.</p>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
