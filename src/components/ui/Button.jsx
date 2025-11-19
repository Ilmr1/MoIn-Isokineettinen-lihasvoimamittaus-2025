import {Show, createMemo, splitProps} from "solid-js";

function getVariantClasses(variant) {
  switch (variant) {
    case "dangerAlt":
      return "bg-gray-200 hover:bg-red-500 text-gray-800 hover:text-white focus-visible:ring-red-400";
    case "danger":
      return "bg-red-500 hover:bg-red-400 text-white focus-visible:ring-red-300";
    case "primaryAlt":
      return "bg-gray-700 hover:bg-gray-600 text-white focus-visible:ring-gray-400";
    case "primary":
      return "bg-green-600 hover:bg-green-500 text-white focus-visible:ring-green-300";
    case "info":
      return "bg-sky-500 hover:bg-sky-400 text-white focus-visible:ring-blue-300";
    default:
      return "bg-gray-200 hover:bg-gray-300 text-gray-800 focus-visible:ring-gray-300";
  }
}

function getSizeClasses(size) {
  switch(size) {
    case "sm":
      return "px-3 py-1 text-sm";
    case "lg":
      return "px-5 py-2 text-base";
    case "xl":
      return "px-6 py-3 text-lg w-full max-w-xs";
    default:
      return "px-4 py-2 text-base";
  }
}

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

    const color = getVariantClasses(local.variant);
    const size = getSizeClasses(local.size);
    
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
