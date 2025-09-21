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
  const [sortState, setSortState] = createSignal({ field: "date", asc: true})
  const [dataFiltering, setDataFiltering] = signals.localStorageBoolean(true);

  const { setParsedFileData } = useParsedFiles();

  const filteredFilesByName = createMemo(() => {
    if (!filterByLastName() || !filterByFirstName()){
      return [];
    }
    const filtered = files().filter((file) => {
      const firstName = file.subjectFirstName.toLowerCase() ?? "";
      const lastName = file.subjectLastName.toLowerCase() ?? "";
      return (
        (!filterByFirstName() || firstName === filterByFirstName()) &&
        (!filterByLastName() || lastName === filterByLastName())
      );
    });

    const sorted = [...filtered];
    const { field, asc} = sortState();

    sorted.sort((a, b) => {
      let valA = a[field] ?? "";
      let valB = b[field] ?? "";
      if (valA === valB) {
        return 0;
      };
      return asc ? (valA < valB ? -1 : 1) : valA > valB ? -1 : 1;
    });
    return sorted;
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
      <div> {/* folder management & pre-load files  */}
        <button onClick={handleOpenDirectory}>Open Folder</button>
        <ul>
          <For each={recentFolders()}>{(directoryHandler, i) => (
            <li>
              <span>{directoryHandler.name} </span>
              <button onClick={async () => {
                const access = await fileUtils.checkOrGrantFileAccess(directoryHandler, "readwrite");
                if (!access) {
                  return;
                }

                setFoldersThatHaveAccess(folders => [...folders, directoryHandler]);
              }}>load</button>
              <button onClick={async () => {
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
          <form onSubmit={handleSubmit}> 
            <input
              type="text"
              placeholder="First name"
              value={firstNameInput()}
              onInput={(e) => setFirstNameInput(e.currentTarget.value)}
            />
            <input 
              type="text"
              placeholder="Last Name"
              value={lastNameInput()}
              onInput={(e) => setLastNameInput(e.currentTarget.value)}
            />
            <button type="submit">Search</button>
            
          </form>
    </div>

    <div> {/* show files after name search */}
      <Show when={filteredFilesByName().length}>
        <For each={filteredFilesByName()}>
          {(file) => (
            <ul>
              <li
                style={{ cursor: "pointer" }}
                onClick={() => handleFileSelect(file)}
              >
                <p>{file.name} {file.date} {file.time} {file.subjectLastName} {file.measurementType}</p>
              </li>
            </ul>
          )}
        </For>
        <div>
          <button onClick={() => toggleSort("time")}>
           Time {sortState().field === "time" ? (sortState().asc ? "desc" : "asc") : ""}
          </button>
          <button onClick={() => toggleSort("date")}>
           Date <span>{sortState().field === "date" ? (sortState().asc ? "desc" : "asc") : ""}</span>
          </button>
        </div>
        <For each={selectedFiles()}>{(fileHandler) =>(
          <ul>
            <li>
              {fileHandler.name}
            </li>
          </ul>
        )}
        </For>
      </Show>
      <button onClick={() => setSelectedFiles([])}>clear</button>
      <button onClick={sendFilesToParse}>parse</button>
      <input type="checkbox" name="dataFiltering" id="dataFiltering" checked={dataFiltering()} onChange={() => setDataFiltering(s => !s)}/>
      <label htmlFor="dataFiltering">Filter data</label>
    </div>
  </div>
  );
}
