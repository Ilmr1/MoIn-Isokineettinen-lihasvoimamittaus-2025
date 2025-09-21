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
    { icon: FiPrinter, label: "Print"},
    { icon: BiRegularExport, label: "Export" },
  ];

  return (
    <div class="w-30 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-6 space-y-6 pt-20">
      {/* Zoom controls */}

        <div class="flex flex-col space-y-1">
          <button onClick={handleZoomIn} class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <AiOutlinePlusCircle class="w-8 h-8 text-gray-600" />
          </button>

          <div class="flex flex-col items-center space-y-1">
        <div class="text-center">
          <div class="text-s text-gray-800">{zoomLevel()}%</div>
        </div>

          <button
            onClick={handleZoomOut}
            class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <AiTwotoneMinusCircle class="w-8 h-8 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Other tools */}
      <For each={otherTools}>
        {(tool) => (
          <div class="flex flex-col items-center space-y-1">
            <button class="p-3 hover:bg-gray-200 rounded-lg transition-colors">
              <tool.icon class="w-10 h-10 text-gray-600" />
            </button>
            <div class="text-center">
              <div class="text-xl text-gray-500">{tool.label}</div>

            </div>
          </div>
        )}
      </For>
    </div>
  );
}
