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
        className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
      >
        {selected() ?? props.label ?? "Select"}
        <span className="ml-2 inline-block transform transition-transform duration-200"
              classList={{"rotate-180": open()}}>
          ▼
        </span>
      </button>

      <Show when={open()}>
        <ul
          class="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-auto py-1 transition ease-out duration-200">
          <For each={props.options}>
            {(opt) => (
              <li
                class="px-4 py-2 text-sm cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition"
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
