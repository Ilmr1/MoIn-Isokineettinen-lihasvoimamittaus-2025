import { openDirectoryAndGetFiles } from "../utils/fileUtils";
import { createSignal } from "solid-js";

export function FileBrowser() {
    const [files, setFiles] = createSignal([]);

    const handleOpenDirectory = async() => {
        const rawFiles = await openDirectoryAndGetFiles();

        const normalizedFiles = rawFiles.map((file) => {
            const name = file.name.replace(/\.ctm$/i, "")
            const measurementDate = file.rawObject?.measurement?.["date(dd/mm/yyyy)"] || "N/A";
            const subjectFirstName = file.rawObject?.session?.subjectNameFirst || "N/A";
            const subjectLastName = file.rawObject?.session?.subjectName || "N/A";
            return {
                name,
                measurementDate,
                subjectFirstName,
                subjectLastName
            };
        });
        
        setFiles(normalizedFiles);
        
    }
    return (
        <div>
            <button onClick={() => handleOpenDirectory()}>Open Folder</button>
            <ul>
                {files().map((file) => (
                    <li>
                        <p>{file.name} {file.measurementDate} {file.subjectFirstName} {file.subjectLastName}</p>
                        
                    </li>
                ))}

            </ul>
        </div>
    );
}