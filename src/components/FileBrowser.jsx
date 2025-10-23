import { batch, createEffect, createMemo, createRenderEffect, createSignal, For, on, Show } from "solid-js";
import { fileUtils, indexedDBUtils } from "../utils/utils";
import FilterFilesFromActiveFolders from "../workers/filterFilesFromActiveFolders.js?worker";
import parseSelectedFiles from "../workers/parseSelectedFiles.js?worker"
import { useParsedFiles } from "../providers";
import { signals } from "../collections/collections";
import { parsedFileData, setParsedFileData } from "../signals";
import { IoDocumentTextSharp, IoFolderOutline } from "solid-icons/io";
import { FiChevronRight } from "solid-icons/fi";
import { FiChevronDown } from "solid-icons/fi";
import { createStore } from "solid-js/store";


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
  const [sessionFilters, storeSessionFilters] = createStore({})

  const {  activeProgram, setActiveProgram, activeFiles } = useParsedFiles();

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

  const toggleSelectedFile = (fileHandler) => {
    const alreadySelected = selectedFiles().some(file => file === fileHandler);
    if (alreadySelected) {
      setSelectedFiles(files => files.filter(file => file !== fileHandler));
    } else {
      setSelectedFiles((prev) => [...prev, fileHandler]);
    }
  }

  const filteredSessions = createMemo(() => {
    const { date, time, foot, speed, program } = sessionFilters;
    const firstName = filterByFirstName();
    const lastName = filterByLastName();

    // TODO: this was quick hack :D
    return structuredClone(sessions().filter(session => {
      if (firstName && !session.files[0]?.subjectFirstName.toLowerCase().includes(firstName.toLowerCase())) {
        return false;
      }
      if (lastName && !session.files[0]?.subjectLastName.toLowerCase().includes(lastName.toLowerCase())) {
        return false;
      }

      if (speed || program || foot) {
        session.filteredFiles = session.files.filter(file => {
          if (speed && file.speed !== speed) {
            return false
          }
          if (program && file.program !== program) {
            return false
          }
          if (foot && file.legSide !== foot) {
            return false
          }

          return true;
        });
      } else {
        session.filteredFiles = session.files;
      }

      if (!session.filteredFiles.length) {
        return false;
      }

      return true;
    })).sort((a, b) => {
      return sortByDate(a, b, date) || sortByTime(a, b, time);
    })
  })
  const sortByDate = (a, b, date) => {
     const aDate = a.files[0].date.split(".").reverse().join("")
     const bDate = b.files[0].date.split(".").reverse().join("")
     if (date === "Oldest") {
      return aDate.localeCompare(bDate)
     } else {
      return bDate.localeCompare(aDate)
     }
  }
  const sortByTime = (a, b, time) => {
     const aTime = a.files[0].time.split(".").reverse().join("")
     const bTime = b.files[0].time.split(".").reverse().join("")
     if (time === "Oldest") {
      return aTime.localeCompare(bTime)
     } else {
      return bTime.localeCompare(aTime)
     }
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
        <SessionsAsATable />
        <ListOfFilesAndSortingControls />
        <ListOfSelectedFiles />
      </div>
    </div>
  );

  function TableHeaderCell(props) {
    return (
      <select onChange={props.onChange}>
        <option value="">
          {props.cellName}
        </option>
        <For each={props.values}>
          {value => (
            <option value={value}>{value}</option>
          )}
        </For>
      </select>
    )
  }


  function SessionsAsATable() {
    const collectedValues = createMemo(()=>{
      const speedValues = new Set();
      const programValues = new Set();

      files().forEach(file => {
        speedValues.add(file.speed);
        programValues.add(file.program);
      });

      return {speed: [...speedValues], program: [...programValues]};
    });

    return (
      <div class="session-table">
        <div class="session-header">
          <p>Session / File</p>
          <TableHeaderCell cellName="Date" values={["Newest","Oldest"]} onChange={(e) => storeSessionFilters("date", e.target.value)}/>
          <TableHeaderCell cellName="Time" values={["Newest","Oldest"]} onChange={(e) => storeSessionFilters("time", e.target.value)}/>
          <p>First</p>
          <p>Last</p>
          <TableHeaderCell cellName="Foot" values={["left","right"]} onChange={(e) => storeSessionFilters("foot", e.target.value)}/>
          <TableHeaderCell cellName="Speed" values={collectedValues().speed} onChange={(e) => storeSessionFilters("speed", e.target.value)}/>
          <TableHeaderCell cellName="Program" values={collectedValues().program} onChange={(e) => storeSessionFilters("program", e.target.value)}/>
          <p>Files</p>
        </div>
        <div class="session-body">

          <For each={filteredSessions()}>
            {(ses) => {
              const [opened, setOpened] = createSignal(false);
              return (
                <>
                  <div class="session-row" classList={{ opened: opened() }} onClick={() => setOpened(s => !s)}>
                    <p class="identifier">
                      <input type="checkbox" onClick={(e) => e.stopPropagation()} />
                      <Show when={opened()} fallback={<FiChevronRight class="w-4 h-4 text-gray-500" />}>
                        <FiChevronDown class="w-4 h-4 text-gray-500" />
                      </Show>
                      <IoFolderOutline class="text-xl text-orange-400" />
                      {ses.sessionId}
                    </p>
                    <p>{ses.filteredFiles[0]?.date}</p>
                    <p>{ses.filteredFiles[0]?.time}</p>
                    <Show when={!safeMode()} fallback={
                      <>
                        <p>{ses.filteredFiles[0]?.subjectFirstName?.[0]}...</p>
                        <p>{ses.filteredFiles[0]?.subjectLastName?.[0]}...</p>
                      </>
                    }>
                      <p>{ses.filteredFiles[0]?.subjectFirstName}</p>
                      <p>{ses.filteredFiles[0]?.subjectLastName}</p>
                    </Show>
                    <p>-</p>
                    <p>-</p>
                    <p>-</p>
                    <p>{ses.filteredFiles.length}</p>
                  </div>
                  <Show when={opened()}>
                    <For each={ses.filteredFiles}>
                      {(file) => (
                        <label
                          class="file-row"
                        >
                          <p class="identifier">
                            <input type="checkbox" onChange={() => toggleSelectedFile(file.fileHandler)}/>
                            <IoDocumentTextSharp class="w-5 h-5 text-blue-500" />
                            {file.name}
                          </p>
                          <p>{file.time}</p>
                          <p>-</p>
                          <p>-</p>
                          <p>{file.legSide}</p>
                          <p>{file.speed}</p>
                          <p>{file.program}</p>
                          <p>-</p>
                        </label>
                      )}
                    </For>
                  </Show>
                </>
              )
            }}
          </For>
        </div>
      </div>
    )
  }

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
      <Show when={activeFiles().length}>
        <div class="bg-gray-50 p-3 rounded-lg space-y-2">
          <div class="flex justify-center gap-2">
            <For each={[...new Set(parsedFileData().map(({rawObject}) => rawObject.programType))].sort()}>{programType => (
              <button
                class="btn-secondary"
                classList={{active: activeProgram() === programType}}
                onClick={() => {
                  setActiveProgram(programType);
                }}
              >
                {programType}
              </button>
            )}</For>
          </div>
          <ul class="space-y-1">
            <For each={activeFiles()}>{(fileHandler) => (
              <li class="text-sm space-x-1">
                <button 
                  class="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-400"
                  onClick={() => removeFileSelection(fileHandler.index)}
                >
                  remove
                </button>
                <span class="font-medium">{fileHandler.name}</span>
                <ol>
                  <For each={fileHandler.rawObject.splitCollections.angle.splits}>{(data, j) => (
                    <Show when={j() % 2 === 0}>
                      <li>
                        <label>
                          <input type="checkbox" name="disableRepetition" checked={!data.disabled} onChange={() => toggleRepetitionDisable(fileHandler.index, j())} />{" "}
                          Repetition {j() / 2 + 1}
                        </label>
                      </li>
                    </Show>
                  )}</For>
                </ol>
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
