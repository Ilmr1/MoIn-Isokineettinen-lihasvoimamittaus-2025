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

        filteredFiles.push({
          fileHandler,
          name: fileHandler.name.replace(/\.CTM$/i, ""),
          lastModifiedDate: fileHandler.lastModifiedDate,
          subjectFirstName: "first name",
          subjectLastName: "last name",
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
    const file = await entry.getFile();
    if (file !== null) {
      yield file;
    }
  } else if (entry.kind === "directory") {
    for await (const handle of entry.values()) {
      yield* getFilesRecursively(handle);
    }
  }
}

