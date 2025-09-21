
export function Header() {
    const patientName = "Milla Heikinen";
    const version = "40.2025";
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center space-y-1">
        <span className="text-4xl font-extrabold tracking-wide">CON-TREX</span>
        <span className="text-xl text-black">Human kinetics</span>
      </div>

        <div className="text-xl flex items-center space-x-20 text-gray-600 pr-10">
          <span>Patient: {patientName}</span>
          <span>Version: {version}</span>
        </div>
      </div>
    </header>
  );
}
