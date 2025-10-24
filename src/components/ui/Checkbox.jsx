import {Show} from "solid-js";

export function Checkbox(props) {
  return (
    <label
      htmlFor={props.id}
      class="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none"
    >
      <input
        id={props.id}
        type="checkbox"
        checked={props.checked}
        onChange={props.onChange}
        class="w-4 h-4 border-2 border-blue-500 rounded-sm bg-white checked:border-blue-500 focus:ring-2 focus:ring-blue-400"
      />

      <Show when={props.label}>
        <span>{props.label}</span>
      </Show>
    </label>
  );
}
