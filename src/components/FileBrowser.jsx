import { createMemo, createRenderEffect, createSignal, on, Show } from "solid-js";
import { fileUtils, indexedDBUtils } from "../utils/utils";
import FilterFilesFromActiveFolders from "../workers/filterFilesFromActiveFolders.js?worker";
import parseSelectedFiles from "../workers/parseSelectedFiles.js?worker"
import { useParsedFiles } from "../providers";
import { signals } from "../collections/collections";


export function FileBrowser() {
  const [files, setFiles] = createSignal([]);
  const [recentFolders, setRecentFolders] = createSignal([]);
  const [foldersThatHaveAccess, setFoldersThatHaveAccess] = createSignal([]);
  const [selectedFiles, setSelectedFiles] = createSignal([]);
  const [filterByLastName, setFilterByLastName] = createSignal("");
  const [filterByFirstName, setFilterByFirstName] = createSignal("");
  const [firstNameInput, setFirstNameInput] = createSignal("");
  const [lastNameInput, setLastNameInput] = createSignal("");
  const [safeMode, setSafeMode] = createSignal(true)
  const [sortState, setSortState] = createSignal({ field: "date", asc: true})
  const [dataFiltering, setDataFiltering] = signals.localStorageBoolean(true);

  const { setParsedFileData } = useParsedFiles();

  const filterAndSortNames = createMemo(() => {
    const allFiles = files();
    const { field, asc } = sortState();

    let firstName = safeMode() ? filterByFirstName() : firstNameInput().trim().toLowerCase();
    let lastName = safeMode() ? filterByLastName() : lastNameInput().trim().toLowerCase();

    let filtered;

    if (safeMode()) {
      if (!firstName || !lastName) {
        return [];
      }
      filtered = allFiles.filter((file) => {
        const fn = file.subjectFirstName?.toLowerCase() ?? "";
        const ln = file.subjectLastName?.toLowerCase() ?? "";
        return fn === firstName && ln === lastName;
      });
    } else {
      filtered = allFiles.filter((file) => {
        const fn = file.subjectFirstName?.toLowerCase() ?? "";
        const ln = file.subjectLastName?.toLowerCase() ?? "";
        return (
          (!firstName || fn.includes(firstName)) &&
            (!lastName || ln.includes(lastName))
        );
      });
    }

    return [...filtered].sort((a, b) => {
      let valA = a[field] ?? "";
      let valB = b[field] ?? "";
      if (valA === valB) return 0;
      return asc ? (valA < valB ? -1 : 1) : valA > valB ? -1 : 1;
    });
  });

  const toggleSort = (field) => {
    setSortState((prev) => ({
      field,
      asc: prev.field === field ? !prev.asc : true
    }));
  }


  createRenderEffect(on(recentFolders, async folders => {
    const newFoldersThatHaveAccess = [];

    for (const folderHandler of folders) {
      const access = await fileUtils.checkFileAccess(folderHandler, "readwrite");
      if (access) {
        newFoldersThatHaveAccess.push(folderHandler);
      }
    }

    setFoldersThatHaveAccess(newFoldersThatHaveAccess);
  }, { defer: true }));

  createRenderEffect(async () => {
    const files = await indexedDBUtils.getValue("file-handlers", "recent-files");
    setRecentFolders(files);
  });


  let worker;
  const sendToWorker = () => {
    if (window.Worker) {
      worker = worker instanceof Worker ? worker : new FilterFilesFromActiveFolders();

      worker.postMessage({
        activeFolders: foldersThatHaveAccess(),
      });

      worker.onmessage = async message => {
        if(message.data === "success") {
          const files = await indexedDBUtils.getValue("file-handlers", "filtered-files");
          setFiles(files);
          console.log("response", files);
        }
      }
    }
  }
  let worker2;
  const sendFilesToParse = () => {
    if (window.Worker) {
      worker2 = worker2 instanceof Worker ? worker2 : new parseSelectedFiles();

      worker2.postMessage({
        filesToParse: selectedFiles(),
        dataFiltering: dataFiltering(),
      });

      worker2.onmessage = async message => {
        if (message.data.type === "parsedFiles") {
          console.log(message.data.files)
          setParsedFileData(message.data.files);
        }
      }
    }
  }

  createRenderEffect(on(foldersThatHaveAccess, sendToWorker, { defer: true }));


  const handleOpenDirectory = async () => {
    const directoryHandler = await window.showDirectoryPicker({ id: "innovation-project", mode: "readwrite" });
    const folders = await indexedDBUtils.getValue("file-handlers", "recent-files") || [];

    for (const folder of folders) {
      if (await folder.isSameEntry(directoryHandler)) {
        return;
      }
    }

    folders.push(directoryHandler);
    await indexedDBUtils.setValue("file-handlers", "recent-files", folders);

    setRecentFolders(folders);
  }



  const handleFileSelect = (file) => {
    const alreadySelected = selectedFiles().some(
      (f) => f.name === file.fileHandler.name
    );
    if (alreadySelected) return;
    console.log(file.fileHandler)
    setSelectedFiles((prev) => [...prev, file.fileHandler]);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setFilterByFirstName(firstNameInput().trim().toLowerCase());
    setFilterByLastName(lastNameInput().trim().toLowerCase());
  }


  return (
    <div class="w-full max-w-2xl mx-auto bg-white shadow-md rounded-2xl p-6 space-y-6">
      {/* Folder management */}
      <button
        class="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg shadow mb-3"
        onClick={handleOpenDirectory}
      >
        Open Folder
      </button>

      <ul class="space-y-2">
        <For each={recentFolders()}>{(directoryHandler, i) => (
          <li class="flex justify-between items-center bg-gray-50 p-2 rounded-lg shadow-sm">
            <span class="font-medium">{directoryHandler.name}</span>
            <div class="space-x-2">
              <button
                class="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                onClick={async () => {
                  const access = await fileUtils.checkOrGrantFileAccess(directoryHandler, "readwrite");
                  if (!access) return;
                  setFoldersThatHaveAccess((folders) => [...folders, directoryHandler]);
                }}
              >
                load
              </button>
              <button
                class="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-400"
                onClick={async () => {
                  const files = await indexedDBUtils.mutateValue(
                    "file-handlers",
                    "recent-files",
                    (result) => {
                      const recentFiles = result || [];
                      recentFiles.splice(i(), 1);
                      return recentFiles;
                    }
                  );
                  setRecentFolders(files);
                }}
              >
                delete
              </button>
            </div>
          </li>
        )}</For>
      </ul>

      {/* Search form */}
      <form onSubmit={handleSubmit} class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="First name"
          value={firstNameInput()}
          onInput={(e) => setFirstNameInput(e.currentTarget.value)}
          class="p-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Last name"
          value={lastNameInput()}
          onInput={(e) => setLastNameInput(e.currentTarget.value)}
          class="p-2 border rounded-lg"
        />
        <button
          type="submit"
          class="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg shadow"
        >
          Search
        </button>
      </form>

      {/* Safe Search */}
      <div class="flex items-center space-x-2 mt-2">
        <input
          id="safe-mode"
          type="checkbox"
          checked={safeMode()}
          onClick={() => setSafeMode((m) => !m)}
          class="w-4 h-4"
        />
        <label for="safe-mode" class="text-sm text-gray-700">
          Safe Search?
        </label>
      </div>

      {/* Show files */}
      <div class="space-y-4">
        <Show when={filterAndSortNames().length}>
          <ul class="divide-y divide-gray-200 rounded-lg border">
            <For each={filterAndSortNames()}>{(file) => (
              <li
                class="p-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleFileSelect(file)}
              >
                <p class="text-sm text-gray-700">
                  {file.name} {file.date} {file.time} {file.subjectLastName} {file.subjectFirstName}
                </p>
              </li>
            )}</For>
          </ul>

          <div class="flex justify-center space-x-3 mt-2">
            <button class="px-3 py-1 bg-gray-200 rounded-lg" onClick={() => toggleSort("time")}>
              Time {sortState().field === "time" ? (sortState().asc ? "↓" : "↑") : ""}
            </button>
            <button class="px-3 py-1 bg-gray-200 rounded-lg" onClick={() => toggleSort("date")}>
              Date {sortState().field === "date" ? (sortState().asc ? "↓" : "↑") : ""}
            </button>
          </div>
        </Show>

        <Show when={selectedFiles().length}>
          <div class="bg-gray-50 p-3 rounded-lg space-y-2">
            <ul class="list-disc list-inside">
              <For each={selectedFiles()}>{(fileHandler) => (
                <li class="text-sm">{fileHandler.name}</li>
              )}</For>
            </ul>
            <div class="flex space-x-2">
              <button class="px-3 py-1 bg-gray-200 rounded-lg" onClick={() => setSelectedFiles([])}>
                clear
              </button>
              <button class="px-3 py-1 bg-gray-200 rounded-lg" onClick={sendFilesToParse}>
                parse
              </button>
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="dataFiltering"
                  checked={dataFiltering()}
                  onChange={() => setDataFiltering((s) => !s)}
                />
                <label for="dataFiltering" class="text-sm">
                  Filter data
                </label>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
