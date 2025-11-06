import {FiPrinter, FiLogOut, FiHardDrive } from 'solid-icons/fi'
import { BiRegularExport } from 'solid-icons/bi';
import { batch, createEffect, createMemo, createSignal, For, untrack } from "solid-js";
import { generatePDF } from '../utils/pdfUtils';
import {ListOfSelectedFiles} from "./ListOfSelectedFiles.jsx";
import { ActiveProgramTypeButtons } from './ActiveProgramTypeButtons.jsx';
import { $selectedSessionsCounts, activeProgram, selectedFiles, setDisabledRepetitions, setSelectedFiles, storeHoveredRepetition, storeSelectedSessionsCounts } from '../signals.js';
import { useGlobalContext } from '../providers.js';
import { Button } from './ui/Button.jsx';
import { ListOfFileHandlerRepetitions } from './ListOfFileHandlerRepetitions.jsx';
import { produce, reconcile } from 'solid-js/store';
import { signals } from '../collections/collections.js';
import { IconButton } from './ui/IconButton.jsx';

export function Sidebar() {
  const {activeFiles} = useGlobalContext();

  return (
    <nav class="side-navigation">
      <div class="flex justify-center ">
        <IconButton onClick={() => document.querySelector("#file-popup")?.showModal()} icon={FiHardDrive} label="files" />
        <Show when={activeFiles().length}>
          <IconButton onClick={generatePDF} icon={FiPrinter} label="Print" />
        </Show>
      </div>
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

      setDisabledRepetitions(reps => {
        if (i in reps) {
          delete reps[i];
          return {...reps};
        }

        return reps;
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

      if (i >= untrack(activeFileIndex)) {
        setActiveFileIndex(v => Math.max(v - 1, 0));
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
          <div class="file-tab-wrapper flex gap-1" classList={{ active: activeFileIndex() === i() }}>
            <button onClick={() => setActiveFileIndex(i())}>
              <div class="file-color-dot" style={{ "background-color": fileHandler.baseColor }}></div>
              <span class="font-medium">{fileHandler.legSide}</span>
            </button>
            <button onClick={() => removeFileSelection(fileHandler.index)}>x</button>
          </div>
        )}</For>
      </div>
      <p>{activeFile().name} {activeFile().time}</p>
      <p>Repetitions</p>
      <ul onMouseLeave={() => storeHoveredRepetition({fileIndex: -1, repetitionIndex: -1})}>
        <ListOfFileHandlerRepetitions fileHandler={activeFile()} />
      </ul>
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
