import { CTMUtils } from "../utils/utils";

onmessage = async (message) => {
  const { filesToParse, dataFiltering, disabledRepetitions } = message.data;
  if (!filesToParse) {
    return;
  }
  console.log("worker", message)
  let files = [];

  for (let i = 0; i < filesToParse.length; i++) {
    const { fileHandler } = filesToParse[i];
    const disabledList = disabledRepetitions[i] || {};
    if (fileHandler.kind === "file") {
      const file = await fileHandler.getFile();
      const text = await file.text();
      const rawObject = CTMUtils.parseTextToObject(text, dataFiltering, disabledList);
      files.push({
        ...filesToParse[i],
        name: file.name,
        index: files.length,
        rawObject
      });
    }
  }

  postMessage({
    type: "parsedFiles",
    files,
  });
};
