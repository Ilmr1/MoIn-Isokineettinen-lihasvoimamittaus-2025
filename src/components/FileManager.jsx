import {createSignal, createMemo, For, createEffect, on} from "solid-js";
import {Tabs} from "@kobalte/core";
import {fileUtils} from "../utils/utils.js";
import {FileBrowser} from "./FileBrowser.jsx";
import {AverageChart} from "./AverageChart.jsx";
import {ThreeCharts} from "./ThreeCharts.jsx"; // keep eager if light; otherwise lazy
import {Repetitions} from "./Repetitions.jsx";
import {useGlobalContext} from "../providers.js";
import {BarChart} from "./BarChart.jsx";
import {parsedFileData, activeProgram, setActiveProgram, showErrorBands, setShowErrorBands} from "../signals.js";

export function FileManager() {
  const {activeFiles} = useGlobalContext();

  createEffect(on(parsedFileData, files => {
    const type = activeProgram();
    const programTypeIsValid = files.some(file => file.rawObject.programType === type);
    if (programTypeIsValid) {
      return;
    }

    setActiveProgram(files[0]?.rawObject.programType)
  }));

  const saveDataAsCSV = (data) => {
    const columns = ["Kammen voima", "Kammen nopeus", "Kammen kulma"];
    fileUtils.generateFileAndDownload(fileUtils.formatToCSV(data, columns), "data.csv", "csv");
  }

  const printDataAsTextToConsole = (data) => {
    console.log(data.map(row => row.map(val => val.toFixed(3)).join("\t")).join("\n"));
  }

  return (
    <div class="w-full h-full bg-gray-100 overflow-y-auto">
      <Tabs.Root defaultValue="files" class="w-full h-full flex flex-col">

        <Tabs.List class="bg-gray-100 shrink-0 p-4 flex flex-wrap min-h-10 gap-2 w-full">
          <Tabs.Trigger value="files" class="tab-trigger">
            Analysis
          </Tabs.Trigger>
          <Tabs.Trigger value="measurement" class="tab-trigger">
            Measurement
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="files" class="bg-white rounded-lg flex-1 overflow-auto">
          <div class="w-full h-full space-y-4 grid place-items-center items-start">
            <FileBrowser/>
            <AverageChart listOfParsedCTM={activeFiles} errorBands={showErrorBands()}/>
            <div class="grid grid-cols-3 gap-2">
              <BarChart listOfParsedCTM={activeFiles} title="Torque max" unit="[Nm]" analysisExtKey="110"
                        analysisFlexKey="111"/>
              <BarChart listOfParsedCTM={activeFiles} title="Torque max avearge" unit="[Nm]" analysisExtKey="112"
                        analysisFlexKey="113"/>
              <BarChart listOfParsedCTM={activeFiles} title="Torque max aver." unit="[Nm/kg]" analysisExtKey="203"
                        analysisFlexKey="204"/>
              <BarChart listOfParsedCTM={activeFiles} title="Time aver. to peak Torque Ext" unit="[s]"
                        analysisExtKey="116"
                        analysisFlexKey="117"/>
              <BarChart listOfParsedCTM={activeFiles} title="Position aver. @ peak Torque" unit="[deg]"
                        analysisExtKey="114"
                        analysisFlexKey="115"/>
              <BarChart listOfParsedCTM={activeFiles} title="Peak Torque Variation" unit="[Nm]"
                        analysisExtKey="250"
                        analysisFlexKey="251"/>
            </div>
            <For each={activeFiles()}>{parsedData => (
              <>
                <ThreeCharts parsedCTM={parsedData.rawObject} fileIndex={parsedData.index}/>
                <div>
                  <button onClick={() => saveDataAsCSV(parsedData.rawObject.data)}>CSV</button>
                  <button class="button_blue"
                          onClick={() => printDataAsTextToConsole(parsedData.rawObject.data)}>txt
                  </button>
                </div>
                {/* <Repetitions repetitions={parsedData.rawObject.repetitions}/> */}
              </>
            )}</For>
          </div>
        </Tabs.Content>
        <Tabs.Content value="measurement" class="bg-white max-w-[905px] rounded-lg p-6 shadow-sm">
          <p class="text-sm text-gray-600">Measurement view placeholder.</p>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
