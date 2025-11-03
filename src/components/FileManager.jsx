import {createSignal, createMemo, For, createEffect, on} from "solid-js";
import {Tabs} from "@kobalte/core";
import {fileUtils} from "../utils/utils.js";
import {FileBrowser} from "./FileBrowser.jsx";
import {AverageChart} from "./AverageChart.jsx";
import {ThreeCharts} from "./ThreeCharts.jsx"; // keep eager if light; otherwise lazy
import {Repetitions} from "./Repetitions.jsx";
import {ParsedFileContext} from "../providers.js";
import {BarChart} from "./BarChart.jsx";
import {parsedFileData} from "../signals.js";

export function FileManager() {
  const [activeProgram, setActiveProgram] = createSignal(null);
  const activeFiles = createMemo(() => {
    const program = activeProgram();
    if (!program) {
      return [];
    }

    const colors = {
      left: ["oklch(0.792 0.209 151.711)", "oklch(84.1% 0.238 128.85)", "oklch(90.5% 0.182 98.111)"],
      right: ["oklch(70.4% 0.191 22.216)", "oklch(71.8% 0.202 349.761)", "oklch(71.4% 0.203 305.504)"],
      fallback: ["oklch(62.3% 0.214 259.815)", "oklch(68.5% 0.169 237.323)", "oklch(71.5% 0.143 215.221)"],
    }

    const indices = {
      left: 0,
      right: 0,
    }

    return parsedFileData()
      .filter(({rawObject}) => rawObject.programType === program)
      .map(row => {
        // Fallback color is blue
        const colorList = colors[row.legSide] ?? colors.fallback;
        return {
          ...row,
          baseColor: colorList[indices[row.legSide]++ % colorList.length],
        }
      });
  });

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
    <div class="w-full h-full bg-gray-100 pt-4 overflow-auto">
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
        <Tabs.Content value="files" class="bg-white rounded-lg flex-1 overflow-visible">
          <ParsedFileContext.Provider value={{activeProgram, setActiveProgram, activeFiles}}>
            <div class="w-full h-full space-y-30 grid place-items-center items-start">
              <FileBrowser/>
              <AverageChart listOfParsedCTM={activeFiles}/>
              <div class="grid grid-cols-3 gap-2">
                <BarChart listOfParsedCTM={activeFiles} title="Torque max" analysisExtKey="110" analysisFlexKey="111"/>
                <BarChart listOfParsedCTM={activeFiles} title="Torque max avearge" analysisExtKey="112"
                          analysisFlexKey="113"/>
                <BarChart listOfParsedCTM={activeFiles} title="Torque max aver." analysisExtKey="203"
                          analysisFlexKey="204"/>
                <BarChart listOfParsedCTM={activeFiles} title="Time aver. to peak Torque Ext" analysisExtKey="116"
                          analysisFlexKey="117"/>
                <BarChart listOfParsedCTM={activeFiles} title="Position aver. @ peak Torque" analysisExtKey="114"
                          analysisFlexKey="115"/>
              </div>
              <For each={activeFiles()}>{parsedData => (
                <>
                  <ThreeCharts parsedCTM={parsedData.rawObject}/>
                  <div>
                    <button onClick={() => saveDataAsCSV(parsedData.rawObject.data)}>CSV</button>
                    <button class="button_blue"
                            onClick={() => printDataAsTextToConsole(parsedData.rawObject.data)}>txt
                    </button>
                  </div>
                  <Repetitions repetitions={parsedData.rawObject.repetitions}/>
                </>
              )}</For>
            </div>
          </ParsedFileContext.Provider>
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
