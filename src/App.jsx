import "./App.css";
import { Sidebar } from "./components/Sidebar.jsx";
import { FileManager } from "./components/FileManager.jsx";

function App() {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-b from-gray-100 to-gray-200">

      {/* Sidebar wrapper: varaa tilan ja tekee stickyksi */}
      <div className="w-full h-20 md:h-screen md:w-20 flex-shrink-0 relative">
        <aside className="w-full h-20 md:h-screen md:w-20
                         sticky top-0 z-10 bg-gray-100 shadow-md">
          <Sidebar />
        </aside>
      </div>

      {/* FileManager, jolla on padding-top vain mobiilissa */}
      <main className="flex-1 flex overflow-auto max-w-full md:pt-0">
        <FileManager />
      </main>
    </div>
  );
}

export default App;
