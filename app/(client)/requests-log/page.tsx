"use client";
import "styles/globals.css";
import React, { useEffect, useState } from "react";
import { getAllLogs, clearLogs, logRequest } from "utils/requestLoggerClient";

// Modal component for details
const DetailsModal = ({
  open,
  onClose,
  log,
}: {
  open: boolean;
  onClose: () => void;
  log: null;
}) => {
  if (!open || !log) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000067]">
      <div className="bg-white max-w-lg w-full max-h-[90vh] rounded-lg shadow-lg p-6 overflow-y-auto relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-hidden"
          aria-label="Close details"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Request Details</h2>
        <pre className="whitespace-pre-wrap break-all text-sm bg-gray-100 p-3 rounded-sm">
          {JSON.stringify(log, null, 2)}
        </pre>
      </div>
    </div>
  );
};

const RequestsLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLog, setModalLog] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const allLogs = await getAllLogs();
    setLogs(allLogs);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleViewDetails = (log) => {
    setModalLog(log);
    setModalOpen(true);
  };

  const handleCopy = async (log) => {
    await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
  };

  const handleClear = async () => {
    setClearLoading(true);
    await clearLogs();
    await fetchLogs();
    setClearLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center *:text-[#1d1d1d]">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h1 className="text-2xl font-bold">Request Logs</h1>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-red-400 disabled:opacity-50"
            onClick={handleClear}
            disabled={clearLoading}
            aria-label="Clear all logs"
          >
            {clearLoading ? "Clearing..." : "Clear All Logs"}
          </button>
        </div>
        <div className="overflow-x-auto rounded-sm shadow-sm bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">User ID</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Timestamp</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr
                    key={log.timestamp || idx}
                    className={
                      log.status !== 200
                        ? "bg-red-50 text-red-700"
                        : idx % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50"
                    }
                  >
                    <td className="p-2 break-all max-w-xs">{log.title}</td>
                    <td className="p-2 break-all">{log.userId}</td>
                    <td className="p-2">{log.status}</td>
                    <td className="p-2">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-2 flex flex-col sm:flex-row gap-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                        onClick={() => handleViewDetails(log)}
                        aria-label="View details"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleViewDetails(log);
                        }}
                      >
                        View Details
                      </button>
                      <button
                        className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-gray-400"
                        onClick={() => handleCopy(log)}
                        aria-label="Copy request JSON"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCopy(log);
                        }}
                      >
                        Copy Request
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        log={modalLog}
      />
    </div>
  );
};

export default RequestsLogPage;
