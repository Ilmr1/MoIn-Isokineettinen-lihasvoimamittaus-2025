import {FiPrinter, FiLogOut } from 'solid-icons/fi';
import { OcCopy3 } from 'solid-icons/oc';
import { BiRegularExport } from 'solid-icons/bi';
import { createSignal, For } from "solid-js";

export function Sidebar() {
  const otherTools = [
    { icon: BiRegularExport, label: "Export" },
    { icon: OcCopy3, label: "Copy" },
    { icon: FiPrinter, label: "Print", onClick: () => window.print() },
    { icon: FiLogOut, label: "Logout", onClick: () => window.close() },
  ];

  return (
    <nav class="flex flex-row md:flex-col items-center justify-around md:justify-start
                space-x-2 md:space-x-0 md:space-y-4 px-2 md:pt-10 h-full">
      <For each={otherTools}>
        {(tool) => (
          <div class="flex flex-col items-center py-2">
            <button
              class="flex flex-col items-center justify-center w-14 h-14 hover:bg-gray-200 rounded-xl transition-colors"
              onClick={tool.onClick}
            >
              <tool.icon class="w-6 h-6 text-gray-600" />
              <span class="mt-1 text-xs text-gray-800 font-medium text-center">
                {tool.label}
              </span>
            </button>
          </div>
        )}
      </For>
    </nav>
  );
}
