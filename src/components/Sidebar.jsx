import {FiPrinter, FiLogOut, FiHardDrive } from 'solid-icons/fi'
import { BiRegularExport } from 'solid-icons/bi';
import { For } from "solid-js";
import { generatePDF } from '../utils/pdfUtils';
import {ListOfSelectedFiles} from "./ListOfSelectedFiles.jsx";

export function Sidebar() {
  const otherTools = [
    { icon: FiHardDrive, label: "Files", onClick: () => document.querySelector("#file-popup")?.showModal() },
    { icon: BiRegularExport, label: "Export" },
    { icon: FiPrinter, label: "Print", onClick: () => generatePDF() },
    { icon: FiLogOut, label: "Quit", onClick: () => window.close() },
  ];

  return (
    <nav class="side-navigation">
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
      <ListOfSelectedFiles />
    </nav>
  );
}
