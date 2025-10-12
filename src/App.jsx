import "./App.css";
import { Sidebar } from "./components/Sidebar.jsx";
import { FileManager } from "./components/FileManager.jsx";

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="flex flex-col max-w-full md:flex-row ">
        <Sidebar />
        <FileManager />
      </div>
    </div>
  );
}

export default App;