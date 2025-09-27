//käydä <BiRegularExport />
import {FiPrinter } from 'solid-icons/fi';
import { OcCopy3 } from 'solid-icons/oc'
import { BiRegularExport } from 'solid-icons/bi';
import { AiOutlinePlusCircle, AiTwotoneMinusCircle } from 'solid-icons/ai'
import { createSignal, For } from "solid-js";

export function Sidebar() {
  const [zoomLevel, setZoomLevel] = createSignal(100);

  const handleZoomIn = () => setZoomLevel(Math.min(zoomLevel() + 25, 200));
  const handleZoomOut = () => setZoomLevel(Math.max(zoomLevel() - 25, 25));

  const otherTools = [

    { icon: OcCopy3, label: "Copy" },
    { icon: FiPrinter, label: "Print", onClick: () => window.print() },
    { icon: BiRegularExport, label: "Export" },
  ];

  return (
    <aside class="fixed top-0 left-0 h-screen w-28 bg-white shadow-md border-r border-gray-200 flex flex-col items-center py-8 space-y-8">
      {/* Zoom controls */}
      <div class="flex flex-col items-center bg-gray-50 p-3 rounded-xl shadow-sm space-y-2">
        <button onClick={handleZoomIn} class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
          <AiOutlinePlusCircle class="w-7 h-7 text-gray-600" />
        </button>


        <div class="text-sm font-medium text-gray-800">{zoomLevel()}%</div>


        <button
          onClick={handleZoomOut}
          class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <AiTwotoneMinusCircle class="w-7 h-7 text-gray-600" />
        </button>
      </div>


      {/* Other tools */}
      <For each={otherTools}>
        {(tool) => (
          <div class="flex flex-col items-center space-y-1">
            <button
              class="p-3 bg-gray-50 hover:bg-gray-200 rounded-xl shadow-sm transition-colors"
              onClick={tool.onClick}
            >
              <tool.icon class="w-8 h-8 text-gray-600" />
            </button>
            <span class="text-xs text-gray-500 font-medium">{tool.label}</span>
          </div>
        )}
      </For>
    </aside>
  );
}
