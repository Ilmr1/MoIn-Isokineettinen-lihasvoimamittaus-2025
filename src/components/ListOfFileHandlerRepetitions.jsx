import {setDisabledRepetitions} from "../signals.js";
import {For, Show} from "solid-js";
import {Checkbox} from "./ui/index.js";

export function ListOfFileHandlerRepetitions(props) {
  const toggleRepetitionDisable = (index, repetition) => {
    setDisabledRepetitions(reps => {
      reps[index] ??= {}
      reps[index][repetition] = !reps[index][repetition];
      reps[index][repetition + 1] = !reps[index][repetition + 1];
      return {...reps};
    });
  }

  return (
    <For each={props.fileHandler.rawObject.splitCollections.angle.splits}>{(data, j) => (
      <Show when={j() % 2 === 0}>
        <li>
          <Checkbox
            id={`disableRepetition-${props.fileHandler.index}-${j()}`}
            label={`Repetition ${j() / 2 + 1}`}
            checked={!data.disabled}
            onChange={() => toggleRepetitionDisable(props.fileHandler.index, j())}/>
        </li>
      </Show>
    )}</For>
  )
}