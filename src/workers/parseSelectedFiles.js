import { CTMUtils } from "../utils/utils";

onmessage = async (message) => {
  const { filesToParse, dataFiltering, disabledRepetitions } = message.data;
  if (!filesToParse) {
    return;
  }
  console.log("worker", message)
  let files = [];

  for (let i = 0; i < filesToParse.length; i++) {
    const handle = filesToParse[i];
    const disabled = disabledRepetitions[i] || {};
    console.log("worker", disabled);
    if (handle.kind === "file") {
      const file = await handle.getFile();
      const text = await file.text();
      const rawObject = CTMUtils.parseTextToObject(text, dataFiltering, disabled);
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
