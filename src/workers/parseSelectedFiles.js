import { CTMUtils } from "../utils/utils";

onmessage = async (message) => {
  const { filesToParse, dataFiltering } = message.data;
  if (!filesToParse) {
    return;
  }
  console.log("worker", message)
  let files = [];

  for await (const handle of filesToParse) {
    if (handle.kind === "file") {
      const file = await handle.getFile();
      const text = await file.text();
      const rawObject = CTMUtils.parseTextToObject(text, dataFiltering);
      files.push({
        name: file.name,
        rawObject
      });
    }
  }

  postMessage({
    type: "parsedFiles",
    files,
  });
};
