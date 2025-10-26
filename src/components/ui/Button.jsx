import {Show, createMemo, splitProps} from "solid-js";

export function Button(props) {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "variant",
    "size",
    "type",
    "onClick",
    "disabled",
    "label",
  ]);

  const classes = createMemo(() => {
    const base =
      "font-medium rounded-lg transition-colors duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed";

    const color =
      local.variant === "danger"
        ? "bg-red-500 hover:bg-red-400 text-white focus-visible:ring-red-300"
        : local.variant === "primary"
          ? "bg-green-500 hover:bg-green-400 text-white focus-visible:ring-green-300"
          : local.variant === "info"
            ? "bg-sky-500 hover:bg-sky-400 text-white focus-visible:ring-blue-300"
            : "bg-gray-200 hover:bg-gray-300 text-gray-800 focus-visible:ring-gray-300";

    const size =
      local.size === "sm"
        ? "px-3 py-1 text-sm"
        : local.size === "lg"
          ? "px-5 py-2 text-base w-full max-w-xs"
          : "px-4 py-2 text-base";

    return [base, color, size, local.class || ""].join(" ").trim();
  });

  return (
    <button
      {...rest}
      type={local.type ?? "button"}
      class={classes()}
      onClick={local.onClick}
      disabled={local.disabled}
    >
      <Show when={local.children} fallback={local.label}>
        {local.children}
      </Show>
    </button>
  );
}
