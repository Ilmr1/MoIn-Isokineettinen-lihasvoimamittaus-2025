import { indexedDBUtils } from "../utils/utils"

onmessage = async (message) => {
  const { activeFolders } = message.data;
  if (!activeFolders) {
    return;
  }

  console.log("worker", message);
  const filteredFiles = [];
  const sessionMap = {};
  let sessionCounter = 0;

  for (const folderHandler of activeFolders) {
    for await (const fileHandler of getFilesRecursively(folderHandler)) {
      if (fileHandler.name.endsWith(".CTM")) {
        const file = await fileHandler.getFile();
        const text = await file.text();
        const parsedFile = parseCTMForFiltering(text);
        const measurement = parsedFile.Measurement;
        const session = parsedFile.session;
        const date = measurement["date (dd/mm/yyyy)"];
        const subjectFirstName = session["subject name first"];
        const subjectLastName = session["subject name"];
        const sessionKey = date + subjectFirstName + subjectLastName;
        if (!sessionMap[sessionKey]) {
          sessionCounter += 1;
          sessionMap[sessionKey] = sessionCounter;
        }

        const sessionNumber = sessionMap[sessionKey];
        const sessionId = `Session ${sessionNumber}`
        filteredFiles.push({
          fileHandler,
          name: fileHandler.name.replace(/\.CTM$/i, ""),
          measurementType: measurement.name,
          date,
          time: measurement["time (hh/mm/ss)"],
          subjectFirstName,
          subjectLastName,
          sessionId,
          legSide: parsedFile.legSide
        });
      }
    }
  }

  await indexedDBUtils.setValue("file-handlers", "filtered-files", filteredFiles);

  postMessage("success");
  // if (data?.length) {
  //   const [picker] = data;
  //   if ((await picker.queryPermission()) === 'granted') {
  //     // return true;
  //   } else if ((await picker.requestPermission(opts)) === 'granted') {
  //     // return true;
  //   }
  //
  //   // const relativePaths = await picker.resolve(handle);
  //   // console.log(relativePaths);
  //   for await (const fileHandle of getFilesRecursively(picker)) {
  //     console.log("From worker", fileHandle);
  //   }
  // }
}

async function* getFilesRecursively(entry) {
  if (entry.kind === "file") {
    yield entry;
    /* const file = await entry.getFile();
    if (file !== null) {
      yield file;
    } */
  } else if (entry.kind === "directory") {
    for await (const handle of entry.values()) {
      yield* getFilesRecursively(handle);
    }
  }
}

function parseCTMForFiltering(text) {
  
  const sections = text.split(/\[(.*)\]/g);
  const filteredObject = {}

  for (let i = 1; i < sections.length; i += 2) {
    const header = sections[i];
    const data = sections[i + 1];
    if (header === "Configuration"){
      const sideIndex = data.indexOf("side");
      const newLineIndex = data.indexOf("\n", sideIndex);
      let side = data.substring(sideIndex, newLineIndex).split("\t").at(-1);
      filteredObject.legSide = side
    }
    if (header === "Measurement" || header === "session"){
      const rows = data.replaceAll("\r", "").trim().split("\n").map(row => row.trim().split("\t"));
      filteredObject[header] = Object.fromEntries(rows.filter(row => row.length > 1))
    }
  }
  return filteredObject;
}

