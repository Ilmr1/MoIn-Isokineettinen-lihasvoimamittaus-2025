import {createSignal, onCleanup, Show, For} from "solid-js";

export function Dropdown(props) {
  const [open, setOpen] = createSignal(false);
  const [selected, setSelected] = createSignal(null);

  const handleSelect = (value) => {
    setSelected(value);
    props.onSelect?.(value);
    setOpen(false); // lista katoaa heti valinnan jälkeen
  };

  // Klikkaus ulkopuolella sulkee listan
  const handleClickOutside = (e) => {
    if (!e.target.closest(".dropdown-container")) {
      setOpen(false);
    }
  };

  document.addEventListener("click", handleClickOutside);
  onCleanup(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  return (
    <div class="relative inline-block text-left dropdown-container">
      <button
        type="button"
        onClick={() => setOpen(!open())}
        class="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 hover:border-gray-400"
      >
        {selected() ?? props.label ?? "Select"}
      </button>

      <Show when={open()}>
        <ul class="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-300 rounded z-10">
          <For each={props.options}>
            {(opt) => (
              <li
                class="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 hover:border-gray-400 border-b last:border-b-0"
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
