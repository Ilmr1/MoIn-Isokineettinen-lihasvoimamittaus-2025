import {
  createSignal,
  createEffect,
  onCleanup,
  Show,
  For,
  mergeProps,
  splitProps,
} from "solid-js";

let activeDropdownSetter = null;

export function Dropdown(p) {
  // Oletuspropsit + jaetaan local propsit
  const merged = mergeProps(
    {
      label: "",
      options: [],
      onSelect: () => {
      },
      disabled: false,
    },
    p
  );
  const [local] = splitProps(merged, [
    "label",
    "options",
    "onSelect",
    "disabled",
  ]);

  const [open, setOpen] = createSignal(false);
  const [selected, setSelected] = createSignal(null);

  const resolve = (v) => (typeof v === "function" ? v() : v);

  // --- Nappi avaa/sulkee dropdownin ---
  const handleButtonClick = () => {
    if (local.disabled) return;

    if (open()) {
      // Jos painetaan uudestaan → resetoi valinta
      setSelected(null);
      local.onSelect(null);
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
    local.onSelect(value);
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
    selected() ? "calc(100% - 20px)" : "calc(100% - 34px)";

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
        disabled={local.disabled}
        class="relative flex flex-col items-center justify-start cursor-pointer h-[52px] outline-none"
        classList={{
          "cursor-default text-gray-400": local.disabled,
          "hover:text-indigo-600": !local.disabled,
        }}
      >
        {/* Label + nuoli */}
        <div class="flex items-center justify-center gap-[2px] font-semibold text-sm leading-none text-gray-700">
          <span>{local.label}</span>
          <Show when={!local.disabled}>
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
          <For each={resolve(local.options)}>
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
