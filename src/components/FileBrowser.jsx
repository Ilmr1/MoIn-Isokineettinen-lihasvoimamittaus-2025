import FilterFilesFromActiveFolders from "../workers/filterFilesFromActiveFolders.js?worker";
import parseSelectedFiles from "../workers/parseSelectedFiles.js?worker"
import {Checkbox} from "./ui/Checkbox.jsx";
import {FiChevronDown, FiChevronRight} from "solid-icons/fi";
import {IoDocumentTextSharp, IoFolderOutline} from "solid-icons/io";
import {batch, createEffect, createMemo, createRenderEffect, createSignal, For, on, Show} from "solid-js";
import {produce, reconcile, unwrap} from "solid-js/store";
import {fileUtils, indexedDBUtils} from "../utils/utils";
import {
  $selectedSessionsCounts,
  dataFiltering,
  disabledRepetitions,
  files,
  filterByFirstName,
  filterByLastName,
  firstNameInput,
  foldersThatHaveAccess,
  lastNameInput,
  recentFolders,
  safeMode,
  selectedFiles,
  sessionFilters,
  sessions,
  setDataFiltering,
  setFiles,
  setFilterByFirstName,
  setFilterByLastName,
  setFirstNameInput,
  setFoldersThatHaveAccess,
  setLastNameInput,
  setParsedFileData,
  setRecentFolders,
  setSafeMode,
  setSelectedFiles,
  setSessions,
  setShowErrorBands,
  showErrorBands,
  storeSelectedSessionsCounts,
  storeSessionFilters
} from "../signals";
import {useGlobalContext} from "../providers";
import {Button} from "./ui/Button.jsx";
import {Dropdown} from "./ui/Dropdown.jsx";

export function FileBrowser() {
  const {activeFiles} = useGlobalContext();

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
      files: sessionFiles,
    }))
  }

  const toggleSelectedFile = (sessionId, selectedFile) => {
    const alreadySelected = selectedFiles().some(file => file.fileHandler === selectedFile.fileHandler);
    batch(() => {
      if (alreadySelected) {
        setSelectedFiles(files => files.filter(selection => selection.fileHandler !== selectedFile.fileHandler));
        storeSelectedSessionsCounts(produce(store => {
          const newFiles = store[sessionId].filter(file => file !== selectedFile.fileHandler);
          if (newFiles.length === 0) {
            delete store[sessionId];
          } else {
            store[sessionId] = newFiles;
          }
        }));
      } else {
        setSelectedFiles((prev) => [...prev, selectedFile]);
        storeSelectedSessionsCounts(produce(store => {
          store[sessionId] ??= [];
          store[sessionId].push(selectedFile.fileHandler);
        }));
      }
    })
  }

  const sortByDate = (a, b, date) => {
    const aDate = a.files[0].date.split(".").reverse().join("")
    const bDate = b.files[0].date.split(".").reverse().join("")
    if (date === "Old") {
      return aDate.localeCompare(bDate)
    } else {
      return bDate.localeCompare(aDate)
    }
  }

  const sortByTime = (a, b, time) => {
    const aTime = a.files[0].time.split(":").reverse().join("")
    const bTime = b.files[0].time.split(":").reverse().join("")
    if (time === "Old") {
      return aTime.localeCompare(bTime)
    } else {
      return bTime.localeCompare(aTime)
    }
  }

  const filteredSessions = createMemo(() => {
    const {date, time, foot, speed, program} = sessionFilters;
    const firstName = filterByFirstName();
    const lastName = filterByLastName();

    const returnArray = [];
    sessions().forEach(session => {
      if (firstName && !session.files[0]?.subjectFirstName?.toLowerCase().includes(firstName.toLowerCase())) {
        return;
      }
      if (lastName && !session.files[0]?.subjectLastName?.toLowerCase().includes(lastName.toLowerCase())) {
        return;
      }

      if (speed || program || foot) {
        var ses = {
          ...session,
          files: session.files.filter(file => {
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
          })
        }
      } else {
        var ses = session;
      }

      if (!ses.files.length) {
        return;
      }

      returnArray.push(ses);
    });

    returnArray.sort((a, b) => {
      return sortByDate(a, b, date) || sortByTime(a, b, time);
    });

    return returnArray;
  });

  createRenderEffect(on(recentFolders, async folders => {
    const newFoldersThatHaveAccess = [];

    for (const folderHandler of folders) {
      const access = await fileUtils.checkFileAccess(folderHandler, "readwrite");
      if (access) {
        newFoldersThatHaveAccess.push(folderHandler);
      }
    }

    setFoldersThatHaveAccess(newFoldersThatHaveAccess);
  }, {defer: true}));

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
        if (message.data === "success") {
          const files = await indexedDBUtils.getValue("file-handlers", "filtered-files");
          console.log("files", files);
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

  createRenderEffect(on(foldersThatHaveAccess, sendToWorker, {defer: true}));


  const handleOpenDirectory = async () => {
    const directoryHandler = await window.showDirectoryPicker({id: "innovation-project", mode: "readwrite"});
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


  const handleSubmit = (e) => {
    e.preventDefault();
    batch(() => {
      setFilterByFirstName(firstNameInput().trim().toLowerCase());
      setFilterByLastName(lastNameInput().trim().toLowerCase());
    });
  }

  const toggleDataFiltering = () => setDataFiltering((s) => !s);

  const clearSelectedFiles = () => {
    batch(() => {
      setSelectedFiles([]);
      storeSelectedSessionsCounts(reconcile({}));
    });
  }

  return (
    <>
      <dialog id="file-popup" class="space-y-4">
        {/* Folder management */}
        <Button
          variant="info"
          size="sm"
          id="file-popup-close"
          onClick={() => document.querySelector("#file-popup").close()}>
          Close

        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleOpenDirectory}
        >
          Open Folder
        </Button>

        <ListOfRecentFolders/>
        <FileSearchForm/>
        <SafeSearchCheckbox/>
        <SessionsAsATable/>
      </dialog>
    </>
  );

  function activeFilesCountInsideSession(sessionId, files) {
    const count = $selectedSessionsCounts[sessionId]?.length;
    let sum = 0;
    if (count > 0) {
      $selectedSessionsCounts[sessionId].forEach(file => {
        for (const f of files) {
          if (f.fileHandler === file) {
            sum++;
            break;
          }
        }
      });
    }
    return sum;
  }

  function SessionsAsATable() {
    const openSessionsMemory = {};
    const collectedValues = createMemo(() => {
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
          <Dropdown label="Session / File" disabled/>
          <Dropdown
            label="Date"
            options={["New", "Old"]}
            onSelect={(value) => storeSessionFilters("date", value)}
            selected={sessionFilters.date}
          />
          <Dropdown
            label="Time"
            options={["New", "Old"]}
            onSelect={(v) => storeSessionFilters("time", v)}
            selected={sessionFilters.time}
          />
          <Dropdown label="First" disabled/>
          <Dropdown label="Last" disabled/>
          <Dropdown
            label="Foot"
            options={["left", "right"]}
            onSelect={(value) => storeSessionFilters("foot", value)}
            selected={sessionFilters.foot}
          />
          <Dropdown
            label="Speed"
            options={collectedValues().speed}
            onSelect={(value) => storeSessionFilters("speed", value)}
            selected={sessionFilters.speed}
          />
          <Dropdown
            label="Program"
            options={collectedValues().program}
            onSelect={(value) => storeSessionFilters("program", value)}
            selected={sessionFilters.program}
          />
          <Dropdown label="Files" disabled/>
        </div>
        <div class="session-body">
          <For each={filteredSessions()}>
            {(ses) => {
              const [opened, setOpened] = createSignal(openSessionsMemory[ses.sessionId]);
              const toggleOpen = () => {
                setOpened(s => {
                  openSessionsMemory[ses.sessionId] = !s;
                  return !s
                });
              }
              return (
                <>
                  <div class="session-row" classList={{opened: opened()}} onClick={toggleOpen}>
                    <p class="identifier">
                      <input
                        type="checkbox"
                        checked={activeFilesCountInsideSession(ses.sessionId, ses.files) > 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          batch(() => {
                            const count = activeFilesCountInsideSession(ses.sessionId, ses.files);
                            if (count > 0) {
                              const files = unwrap($selectedSessionsCounts[ses.sessionId]);
                              ses.files.forEach(file => {
                                if (files.includes(file.fileHandler)) {
                                  toggleSelectedFile(ses.sessionId, file);
                                }
                              });
                            } else {
                              ses.files.forEach(file => {
                                toggleSelectedFile(ses.sessionId, file);
                              });
                            }
                          })
                        }}
                        indeterminate={activeFilesCountInsideSession(ses.sessionId, ses.files) > 0 && activeFilesCountInsideSession(ses.sessionId, ses.files) < ses.files.length}
                      />
                      <Show when={opened()} fallback={<FiChevronRight class="w-4 h-4 text-gray-500"/>}>
                        <FiChevronDown class="w-4 h-4 text-gray-500"/>
                      </Show>
                      <IoFolderOutline class="text-xl text-orange-400"/>
                      {ses.sessionId}
                    </p>
                    <p>{ses.files[0]?.date}</p>
                    <p>{ses.files[0]?.time}</p>
                    <Show when={!safeMode()} fallback={
                      <>
                        <p>{ses.files[0]?.subjectFirstName?.[0]}...</p>
                        <p>{ses.files[0]?.subjectLastName?.[0]}...</p>
                      </>
                    }>
                      <p>{ses.files[0]?.subjectFirstName}</p>
                      <p>{ses.files[0]?.subjectLastName}</p>
                    </Show>
                    <p>-</p>
                    <p>-</p>
                    <p>-</p>
                    <p>{ses.files.length}</p>
                  </div>
                  <Show when={opened()}>
                    <For each={ses.files}>
                      {(file) => (
                        <label class="file-row">
                          <p class="identifier">
                            <input
                              type="checkbox"
                              checked={selectedFiles().some(f => f.fileHandler === file.fileHandler)}
                              onChange={() => toggleSelectedFile(ses.sessionId, file)}
                            />
                            <IoDocumentTextSharp class="w-5 h-5 text-blue-400"/>
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
          <RecentFolderItem directoryHandler={directoryHandler} i={i}/>
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
          <Button
            variant="secondary"
            size="sm"
            onClick={askForFolderAccess}
          >
            load
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={removeRecentFolderByIndex}
          >
            delete
          </Button>
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
          class="p-2 border rounded-lg"/>
        <input
          type="text"
          placeholder="Last name"
          value={lastNameInput()}
          onInput={(e) => setLastNameInput(e.currentTarget.value)}
          class="p-2 border rounded-lg"/>
        <Button
          variant="info"
          size="lg"
          type="submit"
        >
          Search
        </Button>
      </form>
    )
  }

  function SafeSearchCheckbox() {
    return (
      <div class="flex items-center space-x-2 mt-2">
        <Checkbox
          id="safe-mode"
          label="Safe Search?"
          checked={safeMode()}
          onChange={() => setSafeMode((m) => !m)}
        />
        <Button
          variant={sessionFilters.foot || sessionFilters.speed || sessionFilters.program ? "danger" : "secondary"}
          size="sm"
          onClick={() => {
            storeSessionFilters({
              foot: "",
              speed: "",
              program: "",
            });
          }}
        >
          Clear filters
        </Button>
        <Button
          variant={activeFiles().length ? "danger" : "secondary"}
          size="sm"
          onClick={clearSelectedFiles}
        >
          Unselect all
        </Button>
      </div>
    );
  }
}

