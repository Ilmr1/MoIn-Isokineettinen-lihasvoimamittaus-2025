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
    <div>
        {/* folder management & pre-load files  */}
      <div class=" w-full max-w-2xl mx-auto shadow rounded-lg mt-6 p-4 bg-gray-50 w-full">
        <button class="bg-green-300 px-2 py-1 rounded-md hover:bg-green-200 shadow-2xs cursor-pointer transition-all .2s mb-3" onClick={handleOpenDirectory}>Open Folder</button>
        <ul class={"space-y-2"}>
          <For each={recentFolders()}>{(directoryHandler, i) => (
            <li>
              <span>{directoryHandler.name} </span>
              <button class="button_grey mr-1" onClick={async () => {
                const access = await fileUtils.checkOrGrantFileAccess(directoryHandler, "readwrite");
                if (!access) {
                  return;
                }

                setFoldersThatHaveAccess(folders => [...folders, directoryHandler]);
              }}>load</button>
              <button class="bg-red-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium" onClick={async () => {
                const files = await indexedDBUtils.mutateValue("file-handlers", "recent-files", result => {
                  const recentFiles = result || [];
                  recentFiles.splice(i(), 1);
                  return recentFiles;
                });

                setRecentFolders(files);
              }}>delete</button>
            </li>
          )}
          </For>
        </ul>
        <form onSubmit={handleSubmit} class="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
          <input
            type="text"
            placeholder="First name"
            value={firstNameInput()}
            onInput={(e) => setFirstNameInput(e.currentTarget.value)}
            class="p-2 rounded border border-gray-300 w-full"
          />
          <input 
            type="text"
            placeholder="Last Name"
            value={lastNameInput()}
            onInput={(e) => setLastNameInput(e.currentTarget.value)}
            class="p-2 rounded border border-gray-300 w-full"
          />
          <button type="submit" class="bg-sky-200 px-2 py-1 rounded-md hover:bg-sky-100 shadow-2xs cursor-pointer transition-all .2s">Search</button>
        </form>
      </div>

      <div> {/* show files after name search */}
        <Show when={filterAndSortNames().length}>
          <For each={filterAndSortNames()}>
            {(file) => (
              <ul>
                <li
                  style={{ cursor: "pointer" }}
                  onClick={() => handleFileSelect(file)}
                >
                  <p>{file.name} {file.date} {file.time} {file.subjectLastName} {file.subjectFirstName}</p>
                </li>
              </ul>
            )}
          </For>
          <div class="grid gap-2 grid-cols-2 w-max mx-auto">
            <button class="button_grey" onClick={() => toggleSort("time")}>
              Time {sortState().field === "time" ? (sortState().asc ? "desc" : "asc") : ""}
            </button>
            <button class="button_grey" onClick={() => toggleSort("date")}>
              Date <span>{sortState().field === "date" ? (sortState().asc ? "desc" : "asc") : ""}</span>
            </button>
          </div>
        </Show>
        <Show when={selectedFiles().length}>
          <For each={selectedFiles()}>{fileHandler => (
            <ul>
              <li>
                {fileHandler.name}
              </li>
            </ul>
          )}</For>
          <button class="button_grey mr-1" onClick={() => setSelectedFiles([])}>clear</button>
          <button class="button_grey mr-1" onClick={sendFilesToParse}>parse</button>
          <input type="checkbox" name="dataFiltering" id="dataFiltering" checked={dataFiltering()} onChange={() => setDataFiltering(s => !s)}/>
          <label htmlFor="dataFiltering" class="mx-2">Filter data</label>
        </Show>
        <label htmlFor="safe-mode">Safe Search?</label>
        <input type="checkbox" name="safe-mode" id="safe-mode" checked onClick={() => setSafeMode(mode => !mode)} />
      </div>
    </div>
  );
}
