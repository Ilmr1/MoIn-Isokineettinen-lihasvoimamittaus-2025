import { createRenderEffect, createSignal, on } from "solid-js";
import { fileUtils, indexedDBUtils } from "../utils/utils";
import FilterFilesFromActiveFolders from "../workers/filterFilesFromActiveFolders.js?worker";

export function FileBrowser() {
    const [files, setFiles] = createSignal([]);
    const [recentFolders, setRecentFolders] = createSignal([]);
    const [foldersThatHaveAccess, setFoldersThatHaveAccess] = createSignal([]);

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

    createRenderEffect(on(foldersThatHaveAccess, sendToWorker, { defer: true }));

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

    const handleOpenDirectory = async() => {
        const directoryHandle = await window.showDirectoryPicker({ id: "innovation-project", mode: "readwrite" });
        const recentFiles = await indexedDBUtils.mutateValue("file-handlers", "recent-files", (result) => {
            const recentArray = result || [];
            recentArray.push(directoryHandle);

            return recentArray;
        });

        setRecentFolders(recentFiles);

        console.log(recentFiles);
    }

    return (
        <div>
            <button onClick={() => handleOpenDirectory()}>Open Folder</button>
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
                )}</For>
                {files().map((file) => (
                    <li>
                        <p>{file.name} {file.measurementDate} {file.subjectFirstName} {file.subjectLastName}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
