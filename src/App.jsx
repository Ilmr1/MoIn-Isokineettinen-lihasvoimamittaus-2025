import "./App.css";
import { Sidebar } from "./components/Sidebar.jsx";
import { FileManager } from "./components/FileManager.jsx";


function App() {
  return (
    <div class="min-h-screen flex flex-col bg-gray-100 bg-gradient-to-b from-gray-100 to-gray-200">

      <div class="flex-1bg-gray-600 shadow-md">
        <Sidebar className="bg-gray-600 shadow-md"/>

        <FileManager class="flex-1 p-4 md-2 space-y-6 overflow-auto max-w-full ml-28"/>
      </div>
    </div>
  );
}

export default App;
