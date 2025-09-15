import { indexedDBUtils } from "../utils/utils";

onmessage = async (message) => {
  const { activeFolders } = message.data;
  if (!activeFolders) {
    return;
  }

  console.log("worker", message);
  const filteredFiles = []
  for (const folderHandler of activeFolders) {
    for await (const fileHandler of getFilesRecursively(folderHandler)) {
      if (fileHandler.name.endsWith(".CTM")) {
        const file = await fileHandler.getFile();
        const text = await file.text();
        const parsedFile = parseCTMForFiltering(text);
        const measurement = parsedFile.Measurement;
        const session = parsedFile.session;
        filteredFiles.push({
          fileHandler,
          name: fileHandler.name.replace(/\.CTM$/i, ""),
          measurementType: measurement.name,
          date: measurement["date (dd/mm/yyyy)"],
          time: measurement["time (hh/mm/ss)"],
          subjectFirstName: session["subject name first"],
          subjectLastName: session
        });
        // console.log("From worker", fileHandler);
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
    if (header === "Measurement" || header === "session"){
      const data = sections[i + 1];
      const rows = data.replaceAll("\r", "").trim().split("\n").map(row => row.trim().split("\t"));
      filteredObject[header] = Object.fromEntries(rows.filter(row => row.length > 1))
    }
  }
  return filteredObject;
}

