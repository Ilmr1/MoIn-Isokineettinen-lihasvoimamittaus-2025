import {useGlobalContext} from "../providers.js";
import {batch, For, Show, untrack} from "solid-js";
import {$selectedSessionsCounts, selectedFiles, setSelectedFiles, storeSelectedSessionsCounts} from "../signals.js";
import {produce, reconcile} from "solid-js/store";
import {Button} from "./ui/index.js";
import {ActiveProgramTypeButtons} from "./ActiveProgramTypeButtons.jsx";
import {ListOfFileHandlerRepetitions} from "./ListOfFileHandlerRepetitions.jsx";

export function ListOfSelectedFiles() {
  const {activeFiles} = useGlobalContext();

  const clearSelectedFiles = () => {
    batch(() => {
      setSelectedFiles([]);
      storeSelectedSessionsCounts(reconcile({}));
    });
  }

  const removeFileSelection = (i) => batch(() => {
    const {fileHandler} = untrack(selectedFiles)[i];
    batch(() => {
      setSelectedFiles(files => {
        files.splice(i, 1);
        return [...files];
      });
      for (const key in $selectedSessionsCounts) {
        if ($selectedSessionsCounts[key].includes(fileHandler)) {
          storeSelectedSessionsCounts(produce(store => {
            const newFiles = store[key].filter(f => f.fileHandler !== fileHandler)
            if (newFiles.length) {
              store[key] = newFiles;
            } else {
              delete store[key];
            }
          }));

          break;
        }
      }
    })
  });


  return (
    <Show when={activeFiles().length}>
      <div class="bg-gray-50 p-3 rounded-lg space-y-2">
        <div class="flex justify-center gap-2">
          <ActiveProgramTypeButtons />
        </div>
        <ul class="space-y-1">
          <For each={activeFiles()}>{(fileHandler) => (
            <li class="text-sm space-x-1">
              <Button
                variant="danger"
                size="sm"
                onClick={() => removeFileSelection(fileHandler.index)}
              >
                remove
              </Button>
              <span class="font-medium">{fileHandler.name} {fileHandler.legSide} {fileHandler.time}</span>
              <div class="file-color-dot" style={{"background-color": fileHandler.baseColor}}></div>
              <ol class="flex flex-col items-center">
                <ListOfFileHandlerRepetitions fileHandler={fileHandler} />
              </ol>
            </li>
          )}</For>
        </ul>
        <div class="flex space-x-2">
          <Button
            variant="danger"
            size="sm"
            onClick={clearSelectedFiles}
          >
            Clear all
          </Button>
        </div>
      </div>
    </Show>
  )
}

