import { setDisabledRepetitions, storeHoveredRepetition } from "../signals.js";
import { For, Show } from "solid-js";
import { Checkbox } from "./ui/index.js";

export function ListOfFileHandlerRepetitions(props) {
  const toggleRepetitionDisable = (fileName, repetition) => {
    setDisabledRepetitions((reps) => {
      reps[fileName] ??= {};
      reps[fileName][repetition] = !reps[fileName][repetition];
      reps[fileName][repetition + 1] = !reps[fileName][repetition + 1];
      return { ...reps };
    });
  };

  return (
    <For each={props.fileHandler.rawObject.splitCollections.angle.splits}>
      {(data, j) => (
        <Show when={j() % 2 === 0}>
          <li
            onMouseOver={() =>
              storeHoveredRepetition({
                fileIndex: props.fileHandler.index,
                repetitionIndex: j(),
              })
            }
          >
            <Checkbox
              id={`disableRepetition-${props.fileHandler.index}-${j()}`}
              label={`${j() / 2 + 1}`}
              checked={!data.disabled}
              onChange={() =>
                toggleRepetitionDisable(props.fileHandler.name, j())
              }
            />
          </li>
        </Show>
      )}
    </For>
  );
}
