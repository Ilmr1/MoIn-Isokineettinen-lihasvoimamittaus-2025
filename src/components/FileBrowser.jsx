import { batch, createEffect, createMemo, createRenderEffect, createSignal, For, on, Show } from "solid-js";
import { fileUtils, indexedDBUtils } from "../utils/utils";
import FilterFilesFromActiveFolders from "../workers/filterFilesFromActiveFolders.js?worker";
import parseSelectedFiles from "../workers/parseSelectedFiles.js?worker"
import { useParsedFiles } from "../providers";
import { signals } from "../collections/collections";


export function FileBrowser() {
  const [files, setFiles] = createSignal([]);
  const [sessions, setSessions] = createSignal([]);
  const [selectedSession, setSelectedSession] = createSignal("");
  const [recentFolders, setRecentFolders] = createSignal([]);
  const [foldersThatHaveAccess, setFoldersThatHaveAccess] = createSignal([]);
  const [selectedFiles, setSelectedFiles] = createSignal([]);
  const [disabledRepetitions, setDisabledRepetitions] = createSignal({});
  const [filterByLastName, setFilterByLastName] = createSignal("");
  const [filterByFirstName, setFilterByFirstName] = createSignal("");
  const [firstNameInput, setFirstNameInput] = createSignal("");
  const [lastNameInput, setLastNameInput] = createSignal("");
  const [safeMode, setSafeMode] = createSignal(true)
  const [sortState, setSortState] = createSignal({ field: "date", asc: true})
  const [dataFiltering, setDataFiltering] = signals.localStorageBoolean(true);

  const { parsedFileData, setParsedFileData } = useParsedFiles();

  const groupFilesBySession = (files) => {
    const sessionMap = {};
    for (const file of files) {
      if (!sessionMap[file.sessionId]) {
        sessionMap[file.sessionId] = [];
      }
      sessionMap[file.sessionId].push(file);
    }
    return Object.entries(sessionMap).map(([sessionId, sessionFiles]) => ({
      sessionId,
      files: sessionFiles
    }))
  }

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
          const sessions = groupFilesBySession(files);
          setFiles(files);
          setSessions(sessions);
          console.log("response", files);
        }
      }
    }
  }
  let worker2;
  createEffect(() => {
    if (window.Worker) {
      worker2 = worker2 instanceof Worker ? worker2 : new parseSelectedFiles();

      worker2.postMessage({
        filesToParse: selectedFiles(),
        dataFiltering: dataFiltering(),
        disabledRepetitions: disabledRepetitions(),
      });

      worker2.onmessage = async message => {
        if (message.data.type === "parsedFiles") {
          console.log(message.data.files)
          setParsedFileData(message.data.files);
        }
      }
    }
  });

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
    setSelectedFiles((prev) => [...prev, file.fileHandler]);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    batch(() => {
      setFilterByFirstName(firstNameInput().trim().toLowerCase());
      setFilterByLastName(lastNameInput().trim().toLowerCase());
    });
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

      <ListOfRecentFolders />
      <FileSearchForm />
      <SafeSearchCheckbox />
      <div class="space-y-4">
        <ListOfFileSessions />
        <ListOfFilesAndSortingControls />
        <ListOfSelectedFiles />
      </div>
    </div>
  );

  function ListOfRecentFolders() {
    return (
      <ul class="space-y-2">
        <For each={recentFolders()}>{(directoryHandler, i) => (
          <RecentFolderItem directoryHandler={directoryHandler} i={i} />
        )}</For>
      </ul>
    )
  }

  function RecentFolderItem(props) {
    const askForFolderAccess = async () => {
      const access = await fileUtils.checkOrGrantFileAccess(props.directoryHandler, "readwrite");
      if (!access) return;
      setFoldersThatHaveAccess((folders) => [...folders, props.directoryHandler]);
    };

    const removeRecentFolderByIndex = async () => {
      const files = await indexedDBUtils.mutateValue("file-handlers", "recent-files", (result) => {
        const recentFiles = result || [];
        recentFiles.splice(props.i(), 1);
        return recentFiles;
      });

      setRecentFolders(files);
    };

    return (
      <li class="flex justify-between items-center bg-gray-50 p-2 rounded-lg shadow-sm">
        <span class="font-medium">{props.directoryHandler.name}</span>
        <div class="space-x-2">
          <button
            class="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
            onClick={askForFolderAccess}
          >
            load
          </button>
          <button
            class="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-400"
            onClick={removeRecentFolderByIndex}
          >
            delete
          </button>
        </div>
      </li>
    )
  }

  function FileSearchForm() {
    return (
      <form onSubmit={handleSubmit} class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="First name"
          value={firstNameInput()}
          onInput={(e) => setFirstNameInput(e.currentTarget.value)}
          class="p-2 border rounded-lg" />
        <input
          type="text"
          placeholder="Last name"
          value={lastNameInput()}
          onInput={(e) => setLastNameInput(e.currentTarget.value)}
          class="p-2 border rounded-lg" />
        <button
          type="submit"
          class="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg shadow"
        >
          Search
        </button>
      </form>
    )
  }

  function SafeSearchCheckbox() {
    return (
      <div class="flex items-center space-x-2 mt-2">
        <input
          id="safe-mode"
          type="checkbox"
          checked={safeMode()}
          onClick={() => setSafeMode((m) => !m)}
          class="w-4 h-4" />
        <label for="safe-mode" class="text-sm text-gray-700">
          Safe Search?
        </label>
      </div>
    )
  }

  function ListOfFileSessions() {
    return (
      <div>
        <For each={sessions()}>
          {(session) => (
            <div>
              <p onClick={() => setSelectedSession(session)}>{session.sessionId} {session.files[0]?.date}</p>
              <Show when={selectedSession().sessionId === session.sessionId}>
                <For each={selectedSession().files}>
                  {(file) => (
                    <li>
                      {console.log("asd",file)}
                      <p>{file.legSide} {file.time} {file.program} {file.measurementSpeed}</p>
                    </li>
                  )}
                </For>
              </Show>
            </div>
          )}
        </For>
      </div>
    )
  }

  function ListOfFilesAndSortingControls() {
    return (
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
    )
  }

  function ListOfSelectedFiles() {
    const toggleDataFiltering = () => setDataFiltering((s) => !s);
    const clearSelectedFiles = () => setSelectedFiles([]);
    const removeFileSelection = (i) => setSelectedFiles(files => {
      files.splice(i, 1);
      return [...files];
    });

    const toggleRepetitionDisable = (index, repetition) => {
      setDisabledRepetitions(reps => {
        reps[index] ??= {}
        reps[index][repetition] = !reps[index][repetition];
        reps[index][repetition + 1] = !reps[index][repetition + 1];
        return {...reps};
      });
    }

    return (
      <Show when={selectedFiles().length}>
        <div class="bg-gray-50 p-3 rounded-lg space-y-2">
          <ul class="space-y-1">
            <For each={selectedFiles()}>{(fileHandler, i) => (
              <li class="text-sm space-x-1">
                <button 
                  class="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-400"
                  onClick={() => removeFileSelection(i())}
                >
                  remove
                </button>
                <span class="font-medium">{fileHandler.name}</span>
                <Show when={i() < parsedFileData().length}>
                  <ol>
                    <For each={parsedFileData()?.[i()]?.rawObject.splitCollections.angle.splits}>{(data, j) => (
                      <Show when={j() % 2 === 0}>
                        <li>
                          <label>
                            <input type="checkbox" name="disableRepetition" checked={!data.disabled} onChange={() => toggleRepetitionDisable(i(), j())} />{" "}
                            Repetition {j() / 2 + 1}
                          </label>
                        </li>
                      </Show>
                    )}</For>
                  </ol>
                </Show>
              </li>
            )}</For>
          </ul>
          <div class="flex space-x-2">
            <button class="px-3 py-1 bg-gray-200 rounded-lg" onClick={clearSelectedFiles}>
              Clear all
            </button>
            <div class="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dataFiltering"
                checked={dataFiltering()}
                onChange={toggleDataFiltering} />
              <label for="dataFiltering" class="text-sm">
                Filter data
              </label>
            </div>
          </div>
        </div>
      </Show>
    )
  }
}