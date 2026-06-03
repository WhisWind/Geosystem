"use client";
import { useState, useEffect } from "react";

interface HistoryEntry {
  id: string;
  filename: string;
  type: "index" | "water" | "risk";
  satellite?: string;
  index?: string;
  model?: string;
  timestamp: number;
}

interface HistoryFileSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (resultId: string, filename: string) => void;
}

export function HistoryFileSelector({ isOpen, onClose, onSelect }: HistoryFileSelectorProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const historyStr = localStorage.getItem("calculationHistory");
      if (historyStr) {
        try {
          const parsed: HistoryEntry[] = JSON.parse(historyStr);
          const sorted = [...parsed].sort((a, b) => b.timestamp - a.timestamp);
          setHistory(sorted);
        } catch {
          setHistory([]);
        }
      }
    }
  }, [isOpen]);

  const handleSelect = () => {
    if (!selectedId) return;
    const entry = history.find(h => h.id === selectedId);
    if (entry) {
      onSelect(entry.id, entry.filename);
      onClose();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (entry: HistoryEntry) => {
    if (entry.type === "index") return `Индекс: ${entry.index}`;
    if (entry.type === "water") return `Вода: ${entry.model}`;
    return "Риск";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Выбрать из истории</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-2xl">×</button>
        </div>

        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>История расчётов пуста</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 mb-6 scrollbar-hide">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition ${
                    selectedId === entry.id
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        entry.type === "index" ? "bg-blue-100" :
                        entry.type === "water" ? "bg-cyan-100" : "bg-orange-100"
                      }`}>
                        {entry.type === "index" && (
                          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        )}
                        {entry.type === "water" && (
                          <svg className="h-5 w-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                          </svg>
                        )}
                        {entry.type === "risk" && (
                          <svg className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-1 truncate">
                        {entry.filename}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {getTypeLabel(entry)}
                      </div>
                      {entry.satellite && (
                        <div className="text-xs text-gray-500">
                          {entry.satellite}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>

                    {selectedId === entry.id && (
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 p-3 rounded-xl bg-gray-100 text-gray-900 hover:bg-gray-200 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSelect}
                disabled={!selectedId}
                className="flex-1 p-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Использовать файл
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
