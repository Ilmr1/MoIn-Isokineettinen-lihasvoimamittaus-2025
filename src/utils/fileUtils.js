import { asserts } from "../collections/collections";
import { CTMUtils } from "./utils";

export const generateFileAndDownload = (data, filename, type) => {
  const file = new Blob([data], {type: type}),
  a = document.createElement("a"),
  url = URL.createObjectURL(file);

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

export const formatToCSV = (table, columns) => {
  asserts.assert2DArray(table);

  const csv = table.map(row => {
    return row.map(value => {
      if (typeof value === "number") {
        return value.toString().replace(".", ",");
      }
      return value;
    }).join(";");
  }).join("\n");

  if (columns) {
    asserts.assertTypeArray(columns);
    return columns.join(";") + "\n" + csv;
  }

  return csv;
}

export const fetchCTMFileWithName = async fileName => {
  const response = await fetch("./" + fileName);
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder("ISO-8859-1");
  return decoder.decode(buffer);
}

export const openDirectoryAndGetFiles = async () => {
  try {
    let files = [];
    const directoryHandle = await window.showDirectoryPicker();
    for await (const handle of directoryHandle.values()) {
      if (handle.kind === "file") {
        const file = await handle.getFile();
        const text = await file.text();
        const rawObject = CTMUtils.parseTextToObject(text);
        files.push({
          name: file.name,
          rawObject
        });
    }
  }
  
  return files;
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error(err);
    }
  }
  
}

export const askForFileAccess = async (directoryHandler, mode = "readwrite") => {
  const opts = { mode };
  const access = await directoryHandler.requestPermission(opts);
  return access === "granted";
}


export const checkFileAccess = async (directoryHandler, mode = "readwrite") => {
  const opts = { mode };
  const access = await directoryHandler.queryPermission(opts);
  return access === "granted";
}

export const checkOrGrantFileAccess = async (directoryHandler, mode = "readwrite") => {
  const access = await checkFileAccess(directoryHandler, mode);
  if (access) {
    return true
  }

  return await askForFileAccess(directoryHandler, mode);
}
