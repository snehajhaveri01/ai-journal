"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/client";

export default function ExportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: "json" | "markdown" | "csv") {
    setExporting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Please sign in");

      const res = await fetch(`/api/export?format=${format}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Export failed");
      }

      if (format === "json") {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        downloadBlob(blob, `journal-export-${getDateString()}.json`);
      } else {
        const blob = await res.blob();
        const ext = format === "markdown" ? "md" : "csv";
        downloadBlob(blob, `journal-export-${getDateString()}.${ext}`);
      }

      setIsOpen(false);
    } catch (err) {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getDateString() {
    return new Date().toISOString().split("T")[0];
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
        title="Export your journal"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Export
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-200 shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">
                Export Format
              </p>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleExport("json")}
                disabled={exporting}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">JSON</p>
                    <p className="text-xs text-gray-500">
                      Complete data backup
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleExport("markdown")}
                disabled={exporting}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Markdown
                    </p>
                    <p className="text-xs text-gray-500">Readable format</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleExport("csv")}
                disabled={exporting}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">CSV</p>
                    <p className="text-xs text-gray-500">
                      Spreadsheet compatible
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
