//käydä <BiRegularExport />
import {FiPrinter, FiLogOut } from 'solid-icons/fi';
import { OcCopy3 } from 'solid-icons/oc'
import { BiRegularExport } from 'solid-icons/bi';
import { AiOutlinePlusCircle, AiTwotoneMinusCircle } from 'solid-icons/ai'
import { createSignal, For } from "solid-js";

export function Sidebar() {
  const otherTools = [
    { icon: BiRegularExport, label: "Export" },
    { icon: OcCopy3, label: "Copy" },
    { icon: FiPrinter, label: "Print", onClick: () => window.print()},
    { icon: FiLogOut, label: "Logout", onClick: () => window.close()},
  ];

  return (
    <aside class="fixed  bg-gray-100 top-0 left-0 h-screen pt-65
    shadow-md border-r border-gray-200 flex flex-col items-center
    py-8 space-y-8 w-[84px] sm:w-[96px] md:w-[112px] lg:w-[128px]">
      <For each={otherTools}>
        {(tool) => (
          <div class="flex flex-col items-center space-y-1 py-8 space-y-8">
            <button
              class="p-3 bg-gray-50 hover:bg-gray-200 rounded-xl shadow-sm transition-colors"
                onClick={tool.onClick}>
                <tool.icon class="w-10 h-10 text-gray-600" />
            </button>
              <span class="text-2xl text-gray-800 font-medium">{tool.label}</span>
          </div>
        )}
      </For>
    </aside>
  );
}