import { indexedDBUtils } from "../utils/utils"

onmessage = async (message) => {
  const { activeFolders } = message.data;
  if (!activeFolders) {
    return;
  }

  console.log("worker", message);
  const filteredFiles = [];

  for (const folderHandler of activeFolders) {
    for await (const fileHandler of getFilesRecursively(folderHandler)) {
      if (fileHandler.name.endsWith(".CTM") || fileHandler.name.endsWith(".cxp")) {
        const file = await fileHandler.getFile();
        const text = await file.text();
        filteredFiles.push(parseCTMForFiltering(text, fileHandler));
      }
    }
  }

  await indexedDBUtils.setValue("file-handlers", "filtered-files", filteredFiles);

  postMessage("success");
}

async function* getFilesRecursively(entry) {
  if (entry.kind === "file") {
    yield entry;
  } else if (entry.kind === "directory") {
    for await (const handle of entry.values()) {
      yield* getFilesRecursively(handle);
    }
  }
}

function parseCTMForFiltering(text, fileHandler) {
  if (!parseCTMForFiltering.sessionMap) parseCTMForFiltering.sessionMap = {};
  if (!parseCTMForFiltering.sessionCounter) parseCTMForFiltering.sessionCounter = 0;

  const sections = text.split(/\[(.*)\]/g);
  const parsedFile = {}

  for (let i = 1; i < sections.length; i += 2) {
    const header = sections[i];
    const data = sections[i + 1];

    if (header === "Configuration"){
      parsedFile.legSide = extractDataFromString(data, "side");
      parsedFile.speed = extractDataFromString(data, "speed");
      parsedFile.program = extractDataFromString(data, "program");
    }

    if (header === "Measurement" || header === "session"){
      const rows = data.replaceAll("\r", "").trim().split("\n").map(row => row.trim().split("\t"));
      parsedFile[header] = Object.fromEntries(rows.filter(row => row.length > 1))
    }
  }
  
  const { Measurement: measurement, session } = parsedFile;
  const date = measurement["date (dd/mm/yyyy)"];
  const subjectFirstName = session["subject name first"];
  const subjectLastName = session["subject name"];
  const sessionKey = date + subjectFirstName + subjectLastName;

  if (!parseCTMForFiltering.sessionMap[sessionKey]) {
    parseCTMForFiltering.sessionCounter += 1;
    parseCTMForFiltering.sessionMap[sessionKey] = parseCTMForFiltering.sessionCounter;
  }

  const sessionNumber = parseCTMForFiltering.sessionMap[sessionKey];
  const sessionId = `Session ${sessionNumber}`;

  return {
    fileHandler,
    name: fileHandler.name.replace(/\.CTM$/i, ""),
    measurementType: measurement.name,
    date,
    time: measurement["time (hh/mm/ss)"].split(/\.|:/g, 2).join(":"),
    subjectFirstName,
    subjectLastName,
    sessionId,
    legSide: parsedFile.legSide,
    program: parsedFile.program,
    speed: parsedFile.speed
  };
}

const extractDataFromString = (data, key) => {
  const keyIndex = data.indexOf(key);
  const newLineIndex = data.indexOf("\n", keyIndex);
  const line = data.substring(keyIndex, newLineIndex);
  const parts = line.split("\t");

  switch (key) {
    case "side":
      return parts.at(-1).trim();
    case "speed":
      let values = parts.slice(1).map(v => v.trim());
      return values.join("/");
    case "program":
      let lastval = parts[2].split(" ").map(s => s.trim())
      return lastval[2];
  }
}

