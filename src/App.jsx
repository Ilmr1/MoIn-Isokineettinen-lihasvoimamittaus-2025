import "./App.css";
import { Sidebar } from "./components/Sidebar.jsx";
import { FileManager } from "./components/FileManager.jsx";

function App() {
  return (
    <div class="w-full h-full inset-0 absolute">
      <div class="grid gap-2 grid-cols-[250px_1fr] w-full h-full max-w-7xl mx-auto p-4">
        <Sidebar />
        <FileManager />
      </div>
    </div>
  );
}

export default App;
