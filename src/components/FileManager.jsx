import {createSignal, createMemo, For, createEffect, on} from "solid-js";
import {fileUtils} from "../utils/utils.js";
import {FileBrowser} from "./FileBrowser.jsx";
import {AverageChart} from "./AverageChart.jsx";
import {ThreeCharts} from "./ThreeCharts.jsx";
import {useGlobalContext} from "../providers.js";
import {BarChart} from "./BarChart.jsx";
import {Button} from "./ui/Button.jsx";
import {
  parsedFileData,
  activeProgram,
  setActiveProgram,
  showErrorBands,
  setShowErrorBands,
  activeFileIndex,
} from "../signals.js";

export function FileManager() {
  const {activeFiles} = useGlobalContext();

  createEffect(
    on(parsedFileData, (files) => {
      const type = activeProgram();
      const programTypeIsValid = files.some(
        (file) => file.rawObject.programType === type,
      );
      if (programTypeIsValid) {
        return;
      }

      setActiveProgram(files[0]?.rawObject.programType);
    }),
  );

  const saveDataAsCSV = (data) => {
    const columns = ["Kammen voima", "Kammen nopeus", "Kammen kulma"];
    fileUtils.generateFileAndDownload(
      fileUtils.formatToCSV(data, columns),
      "data.csv",
      "csv",
    );
  };

  const printDataAsTextToConsole = (data) => {
    console.log(
      data.map((row) => row.map((val) => val.toFixed(3)).join("\t")).join("\n"),
    );
  };

  return (
    <div class="w-full h-full bg-gray-100 overflow-y-auto flex flex-col py-4 pr-4">
      <FileBrowser/>
      <div class="bg-white rounded-lg flex-1 overflow-auto">
        <div class="w-full h-full space-y-4 grid place-items-center items-start p-8">
          <AverageChart
            listOfParsedCTM={activeFiles}
            errorBands={showErrorBands()}
          />
          <div class="grid grid-cols-3 gap-2">
            <BarChart
              listOfParsedCTM={activeFiles}
              title="Maksimivääntö"
              unit="[Nm]"
              analysisExtKey="110"
              analysisFlexKey="111"
            />
            <BarChart
              listOfParsedCTM={activeFiles}
              title="Maksimivääntö keskiarvo"
              unit="[Nm]"
              analysisExtKey="112"
              analysisFlexKey="113"
            />
            <BarChart
              listOfParsedCTM={activeFiles}
              title="Maksimivääntö keskiarvo / kg"
              unit="[Nm/kg]"
              analysisExtKey="203"
              analysisFlexKey="204"
            />
            <BarChart
              listOfParsedCTM={activeFiles}
              title="Ajankeskiarvo huippuväännössä"
              unit="[s]"
              analysisExtKey="116"
              analysisFlexKey="117"
            />
            <BarChart
              listOfParsedCTM={activeFiles}
              title="Kulmankeskiarvo huippuväännössä"
              unit="[aste]"
              analysisExtKey="114"
              analysisFlexKey="115"
            />
            <BarChart
              listOfParsedCTM={activeFiles}
              title="Huippuväännön vaihtelu"
              unit="[Nm]"
              analysisExtKey="250"
              analysisFlexKey="251"
            />
          </div>
          <Show when={activeFiles()[activeFileIndex()]}>
            {(activeFile) => (
              <>
                <ThreeCharts
                  parsedCTM={activeFile().rawObject}
                  fileIndex={activeFile().index}
                />
                <div class="flex gap-2 pb-6">
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => saveDataAsCSV(activeFile().rawObject.data)}
                  >
                    Download as CSV
                  </Button>
                  <Show when={location.href.includes("localhost")}>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        printDataAsTextToConsole(activeFile().rawObject.data)
                      }
                    >
                      Print to console [DEBUG]
                    </Button>
                  </Show>
                </div>
              </>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
}

