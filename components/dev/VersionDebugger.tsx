import React from "react";
import { getVersionInfo, forceVersionUpdate } from "utils/version-manager";

const VersionDebugger: React.FC = () => {
  const [versionInfo, setVersionInfo] = React.useState(getVersionInfo());

  const handleRefreshInfo = () => {
    setVersionInfo(getVersionInfo());
  };

  const handleForceUpdate = () => {
    forceVersionUpdate();
  };

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="text-sm font-bold mb-2">Version Debugger</h3>
      <div className="text-xs space-y-1">
        <div>
          Current Version:{" "}
          <span className="text-green-400">{versionInfo.currentVersion}</span>
        </div>
        <div>
          Stored Version:{" "}
          <span className="text-yellow-400">
            {versionInfo.storedVersion || "None"}
          </span>
        </div>
        <div>
          Needs Update:{" "}
          <span
            className={
              versionInfo.needsUpdate ? "text-red-400" : "text-green-400"
            }
          >
            {versionInfo.needsUpdate ? "Yes" : "No"}
          </span>
        </div>
      </div>
      <div className="mt-3 space-x-2">
        <button
          onClick={handleRefreshInfo}
          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
        >
          Refresh
        </button>
        <button
          onClick={handleForceUpdate}
          className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
        >
          Force Update
        </button>
      </div>
    </div>
  );
};

export default VersionDebugger;
