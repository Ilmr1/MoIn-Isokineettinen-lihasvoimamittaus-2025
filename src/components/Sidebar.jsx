import {FiPrinter, FiHardDrive} from "solid-icons/fi";
import {
  batch,
  createEffect,
  createMemo,
  For,
  Show,
} from "solid-js";
import {generatePDF} from "../utils/pdfUtils";
import {ActiveProgramTypeButtons} from "./ActiveProgramTypeButtons.jsx";
import {
  activeProgram,
  selectedFiles,
  setSelectedFiles,
  storeHoveredRepetition,
  storeSelectedSessionsCounts,
  dataFiltering,
  setDataFiltering,
  showErrorBands,
  setShowErrorBands,
  activeFileIndex,
  setActiveFileIndex,
  toggleSelectedFile,
  setDisabledRepetitions
} from "../signals.js";
import {useGlobalContext} from "../providers.js";
import {Button} from "./ui/Button.jsx";
import {ListOfFileHandlerRepetitions} from "./ListOfFileHandlerRepetitions.jsx";
import {reconcile} from "solid-js/store";
import {IconButton} from "./ui/IconButton.jsx";
import {Checkbox} from "./ui/Checkbox.jsx";

export function Sidebar() {
  const {activeFiles} = useGlobalContext();

  const toggleDataFiltering = () => setDataFiltering((s) => !s);

  const clearSelectedFiles = () => {
    batch(() => {
      setSelectedFiles([]);
      setDisabledRepetitions([]);
      storeSelectedSessionsCounts(reconcile({}));
    });
  };

  return (
    <nav
      class="flex flex-col bg-gray-100
        p-4 rounded-none relative z-10
        h-full top-0 overflow-y-auto
        w-[360px] shrink-0"
    >
      <div class="flex flex-col gap-4 bg-white rounded-lg p-4 shadow-sm">
        {/* Files ja Print */}
        <div class="flex flex-col items-center gap-4 border border-gray-200 rounded-lg p-4">
          <div class="flex gap-4">
            <IconButton
              onClick={() => document.querySelector("#file-popup")?.showModal()}
              icon={FiHardDrive}
              label="files"
            />
            <Show when={activeFiles().length}>
              <IconButton onClick={generatePDF} icon={FiPrinter} label="Print"/>
            </Show>
          </div>

          <Show when={!activeFiles().length}>
            <p class="text-sm text-gray-500 text-center mt-2">
              Click the button above to select files.
            </p>
          </Show>
        </div>

        {/* Data Filter + Clear all laatikko */}
        <Show when={activeFiles().length}>
          <div class="flex flex-col gap-3 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-2">
                <Checkbox
                  id="dataFiltering"
                  label="Filter data"
                  checked={dataFiltering()}
                  onChange={toggleDataFiltering}
                />
                <Checkbox
                  label="Show error bands"
                  checked={showErrorBands()}
                  onChange={() => setShowErrorBands((s) => !s)}
                />
              </div>
              <Button
                variant="dangerAlt"
                size="sm"
                onClick={clearSelectedFiles}
                class="self-center"
              >
                Clear all
              </Button>
            </div>
          </div>
        </Show>


        {/* Ohjelmatyypit */}
        <Show when={activeFiles().length}>
          <div class="flex flex-wrap justify-center gap-2 border border-gray-200 rounded-lg p-3">
            <ActiveProgramTypeButtons/>
          </div>
          {/* Aktiiviset tiedostot ja toistot */}
          <ActiveFilesAndRepetitions/>
        </Show>
      </div>
    </nav>
  );
}

function ActiveFilesAndRepetitions() {
  const {activeFiles} = useGlobalContext();

  createEffect(() => {
    activeProgram();
    setActiveFileIndex(0);
  });

  const activeFile = createMemo(
    () => activeFiles()[activeFileIndex()] ?? activeFiles()[0]
  );

  return (
    <div class="flex flex-col gap-4">
      {/* Left / Right laatikko */}
      <div class="border border-gray-200 rounded-lg p-4">
        <div class="grid grid-cols-2 gap-2">
          <For each={["left", "right"]}>
            {(side) => (
              <div class="flex-1 flex flex-col bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p class="text-center font-semibold text-gray-700 mb-2 capitalize">
                  {side}
                </p>
                <div class="flex flex-col gap-2">
                  <For each={activeFiles().filter((f) => f.legSide?.toLowerCase() === side)}>
                    {(fileHandler) => {
                      const originalIndex = () => activeFiles().findIndex(f => f === fileHandler);
                      const isActive = () => activeFile() === fileHandler

                      return (
                        <div class="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant={isActive() ? "primaryAlt" : "default"}
                            onClick={() => setActiveFileIndex(originalIndex())}
                            class="flex items-center justify-between gap-2 w-full"
                          >
                            {fileHandler.legSide}
                            <span
                              class="w-2 h-2 rounded-full"
                              style={{
                                "background-color": fileHandler.baseColor,
                              }}
                            />
                          </Button>

                          <Button
                            size="sm"
                            variant="dangerAlt"
                            label="︎×"
                            onClick={() =>
                              toggleSelectedFile(fileHandler.sessionId, selectedFiles()[fileHandler.index])
                            }
                          />
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Repetitions laatikko */}
      <div class="border border-gray-200 rounded-lg p-4">
        <p class="text-center font-medium">
          {activeFile().name} {activeFile().time}
        </p>
        <p class="text-center text-gray-700 mt-1 mb-3">Repetitions</p>

        <div class="overflow-y-auto max-h-[200px]">
          <ul
            class="flex flex-col items-center gap-1"
            onMouseLeave={clearRepetitionHover}
          >
            <ListOfFileHandlerRepetitions fileHandler={activeFile()}/>
          </ul>
        </div>
      </div>
    </div>
  );
}

function clearRepetitionHover() {
  storeHoveredRepetition({fileIndex: -1, repetitionIndex: -1})
}
