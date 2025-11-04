import {FiPrinter, FiLogOut, FiHardDrive } from 'solid-icons/fi'
import { BiRegularExport } from 'solid-icons/bi';
import { batch, createEffect, createMemo, createSignal, For, untrack } from "solid-js";
import { generatePDF } from '../utils/pdfUtils';
import {ListOfSelectedFiles} from "./ListOfSelectedFiles.jsx";
import { ActiveProgramTypeButtons } from './ActiveProgramTypeButtons.jsx';
import { $selectedSessionsCounts, activeProgram, selectedFiles, setSelectedFiles, storeSelectedSessionsCounts } from '../signals.js';
import { useGlobalContext } from '../providers.js';
import { Button } from './ui/Button.jsx';
import { ListOfFileHandlerRepetitions } from './ListOfFileHandlerRepetitions.jsx';
import { produce, reconcile } from 'solid-js/store';
import { signals } from '../collections/collections.js';

export function Sidebar() {
  const otherTools = [
    { icon: FiHardDrive, label: "Files", onClick: () => document.querySelector("#file-popup")?.showModal() },
    { icon: BiRegularExport, label: "Export" },
    { icon: FiPrinter, label: "Print", onClick: () => generatePDF() },
    { icon: FiLogOut, label: "Quit", onClick: () => window.close() },
  ];

  return (
    <nav class="side-navigation">
      <For each={otherTools}>
        {(tool) => (
          <div class="flex flex-col items-center py-2">
            <button
              class="flex flex-col items-center justify-center w-14 h-14 hover:bg-gray-200 rounded-xl transition-colors"
              onClick={tool.onClick}
            >
              <tool.icon class="w-6 h-6 text-gray-600" />
              <span class="mt-1 text-xs text-gray-800 font-medium text-center">
                {tool.label}
              </span>
            </button>
          </div>
        )}
      </For>
      <ActiveProgramTypeButtons />
      <ActiveFilesAndRepetitions />
      {/* <ListOfSelectedFiles /> */}
    </nav>
  );
}

function ActiveFilesAndRepetitions() {
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

  const [activeFileIndex, setActiveFileIndex] = createSignal(0);

  createEffect(() => {
    activeProgram();
    setActiveFileIndex(0);
  });

  const activeFile = createMemo(() => activeFiles()[activeFileIndex()]);

  return (
    <Show when={activeFiles().length}>
      <div class="flex gap-4">
        <For each={activeFiles()}>{(fileHandler, i) => (
          <div class="file-tab-wrapper flex gap-1" classList={{active: activeFileIndex() === i()}}>
            <button onClick={() => setActiveFileIndex(i())}>
              <div class="file-color-dot" style={{"background-color": fileHandler.baseColor}}></div>
              <span class="font-medium">{fileHandler.legSide}</span>
            </button>
            <button onClick={() => removeFileSelection(fileHandler.index)}>x</button>
          </div>
        )}</For>
      </div>
      <p>{activeFile().name} {activeFile().time}</p>
      <p>Repetitions</p>
      <ListOfFileHandlerRepetitions fileHandler={activeFile()} />
      <Button
        variant="danger"
        size="sm"
        onClick={clearSelectedFiles}
      >
        Clear all
      </Button>
    </Show>
  );
}
