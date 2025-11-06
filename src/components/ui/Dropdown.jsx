import {
  createSignal,
  createEffect,
  onCleanup,
  Show,
  For,
  mergeProps
} from "solid-js";
import { signalUtils } from "../../utils/utils";

let activeDropdownSetter = null;

export function Dropdown(props) {
  // lisää oletuspropsit
  props = mergeProps(
    {
      label: "",
      options: [],
      onSelect: () => null,
      selected: null,
      disabled: false,
    },
    props
  );

  const [open, setOpen] = createSignal(false);
  const [selected, setSelected] = signalUtils.createEffectSignal(() => props.selected);

  const resolve = (v) => (typeof v === "function" ? v() : v);

  // --- Nappi avaa/sulkee dropdownin ---
  const handleButtonClick = () => {
    if (props.disabled) return;

    if (open()) {
      // Jos painetaan uudestaan → resetoi valinta
      setSelected(null);
      props.onSelect(null);
      setOpen(false);
      activeDropdownSetter = null;
    } else {
      // Sulje muut dropdownit jos auki
      if (activeDropdownSetter && activeDropdownSetter !== setOpen)
        activeDropdownSetter(false);

      setOpen(true);
      activeDropdownSetter = setOpen;
    }
  };

  // --- Valinnan tekeminen ---
  const handleSelect = (value) => {
    setSelected(value);
    props.onSelect(value);
    setOpen(false);
    activeDropdownSetter = null;
  };

  // --- Klikki ulkopuolelle sulkee dropdownin ---
  const handleClickOutside = (e) => {
    if (!e.target.closest(".dropdown-container")) {
      setOpen(false);
      if (activeDropdownSetter === setOpen) activeDropdownSetter = null;
    }
  };

  // --- Event listener hallinta ---
  createEffect(() => {
    document.addEventListener("click", handleClickOutside);
    onCleanup(() => document.removeEventListener("click", handleClickOutside));
  });

  // --- Dropdownin pystysijainti ---
  const dropdownOffset = () =>
    selected() ? "calc(100% + 3px)" : "calc(100% - 10px)";

  return (
    <div
      class="relative inline-block text-left dropdown-container select-none"
      style={{
        "min-width": "fit-content",
      }}
    >
      {/* Pääpainike */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={props.disabled}
        class="relative flex flex-col items-center justify-start cursor-pointer h-[30px] outline-none"
        classList={{
          "cursor-default text-gray-400": props.disabled,
          "hover:text-indigo-600": !props.disabled,
        }}
      >
        {/* Label + nuoli */}
        <div class="flex items-center justify-center gap-[2px] font-semibold text-sm leading-none text-gray-700">
          <span>{props.label}</span>
          <Show when={!props.disabled}>
            <span
              class="transition-transform duration-200 text-gray-500"
              classList={{"rotate-180": open()}}
            >
              ▾
            </span>
          </Show>
        </div>

        {/* Valittu arvo labelin alla */}
        <Show when={selected()}>
          <div class="mt-[1px] text-xs text-gray-500 font-semibold text-center">
            {selected()}
          </div>
        </Show>
      </button>

      {/* Dropdown-valikko */}
      <Show when={open()}>
        <ul
          class="absolute left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]
                 max-h-60 overflow-auto py-1 text-sm w-max min-w-[100%] text-center
                 transition-all duration-150 ease-out"
          style={{
            top: dropdownOffset(),
            isolation: "isolate",
          }}
        >
          <For each={resolve(props.options)}>
            {(opt) => (
              <li
                class="flex items-center justify-center px-4 py-1 cursor-pointer
                       font-semibold  text-gray-700 hover:bg-gray-200 transition"
                onClick={() => handleSelect(opt)}
              >
                <span>{opt}</span>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
