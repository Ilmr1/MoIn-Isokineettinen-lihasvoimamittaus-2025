import {FiPrinter, FiHardDrive} from "solid-icons/fi";
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  untrack,
} from "solid-js";
import {generatePDF} from "../utils/pdfUtils";
import {ActiveProgramTypeButtons} from "./ActiveProgramTypeButtons.jsx";
import {
  $selectedSessionsCounts,
  activeProgram,
  selectedFiles,
  setDisabledRepetitions,
  setSelectedFiles,
  storeHoveredRepetition,
  storeSelectedSessionsCounts,
} from "../signals.js";
import {useGlobalContext} from "../providers.js";
import {Button} from "./ui/Button.jsx";
import {ListOfFileHandlerRepetitions} from "./ListOfFileHandlerRepetitions.jsx";
import {produce, reconcile} from "solid-js/store";
import {IconButton} from "./ui/IconButton.jsx";

export function Sidebar() {
  const {activeFiles} = useGlobalContext();

  return (
    <nav
      class="flex flex-col bg-gray-50 border-r border-gray-200
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

        {/* Ohjelmatyypit */}
        <Show when={activeFiles().length}>
          <div class="flex flex-wrap justify-center gap-2 border border-gray-200 rounded-lg p-3">
            <ActiveProgramTypeButtons/>
          </div>
        </Show>

        {/* Aktiiviset tiedostot ja toistot */}
        <Show when={activeFiles().length}>
          <ActiveFilesAndRepetitions/>
        </Show>
      </div>
    </nav>
  );
}

function ActiveFilesAndRepetitions() {
  const {activeFiles} = useGlobalContext();
  const [activeFileIndex, setActiveFileIndex] = createSignal(0);

  const clearSelectedFiles = () => {
    batch(() => {
      setSelectedFiles([]);
      storeSelectedSessionsCounts(reconcile({}));
    });
  };

  const removeFileSelection = (i) =>
    batch(() => {
      const {fileHandler} = untrack(selectedFiles)[i];
      batch(() => {
        setSelectedFiles((files) => {
          files.splice(i, 1);
          return [...files];
        });

        setDisabledRepetitions((reps) => {
          if (i in reps) {
            delete reps[i];
            return {...reps};
          }
          return reps;
        });

        for (const key in $selectedSessionsCounts) {
          if ($selectedSessionsCounts[key].includes(fileHandler)) {
            storeSelectedSessionsCounts(
              produce((store) => {
                const newFiles = store[key].filter(
                  (f) => f.fileHandler !== fileHandler
                );
                if (newFiles.length) store[key] = newFiles;
                else delete store[key];
              })
            );
            break;
          }
        }

        if (i >= untrack(activeFileIndex)) {
          setActiveFileIndex((v) => Math.max(v - 1, 0));
        }
      });
    });

  createEffect(() => {
    activeProgram();
    setActiveFileIndex(0);
  });

  const activeFile = createMemo(() => activeFiles()[activeFileIndex()]);

  return (
    <div class="flex flex-col gap-4">
      {/* Left / Right laatikko */}
      <div class="border border-gray-200 rounded-lg p-4">
        <div class="flex justify-center gap-2">
          <For each={["left", "right"]}>
            {(side) => (
              <div class="flex-1 flex flex-col bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p class="text-center font-semibold text-gray-700 mb-2 capitalize">
                  {side}
                </p>
                <div class="flex flex-col gap-2">
                  <For each={activeFiles().filter(f => f.legSide?.toLowerCase() === side)}>
                    {(fileHandler) => {
                      const originalIndex = activeFiles().findIndex(
                        (f) => f.index === fileHandler.index
                      );
                      const isActive = () =>
                        activeFileIndex() === originalIndex;

                      return (
                        <div class="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant={isActive() ? "primary" : "default"}
                            onClick={() => setActiveFileIndex(originalIndex)}
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
                            variant="danger"
                            label="×"
                            onClick={() =>
                              removeFileSelection(fileHandler.index)
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
            onMouseLeave={() =>
              storeHoveredRepetition({
                fileIndex: -1,
                repetitionIndex: -1,
              })
            }
          >
            <ListOfFileHandlerRepetitions fileHandler={activeFile()}/>
          </ul>
        </div>

        <div class="flex justify-center mt-4">
          <Button
            variant="danger"
            size="sm"
            onClick={clearSelectedFiles}
            class="w-fit"
          >
            Clear all
          </Button>
        </div>
      </div>
    </div>
  );
}
