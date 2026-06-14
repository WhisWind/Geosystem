interface HistoryEntry {
  id: string;
  filename: string;
  type: "index" | "water" | "risk";
  satellite?: string;
  index?: string;
  model?: string;
  threshold?: number;
  scenario?: string;
  timestamp: number;
}

interface HistorySidebarProps {
  history: HistoryEntry[];
  selectedId: string | null;
  isOpen: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function HistorySidebar({ history, selectedId, isOpen, onSelect, onClose }: HistorySidebarProps) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}

      <div className={`
        md:flex-shrink-0 md:w-64 lg:w-80 md:bg-white/80 md:rounded-3xl md:border md:border-gray-200 md:p-6 md:shadow-2xl md:backdrop-blur-xl
        ${isOpen 
          ? 'fixed inset-y-0 left-0 z-50 w-80 bg-white p-6 shadow-2xl overflow-y-auto' 
          : 'hidden md:block'
        }
      `}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-900">История расчётов</div>
          <button 
            onClick={onClose}
            className="md:hidden rounded-full bg-gray-100 p-2"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={[
                "w-full rounded-2xl border p-4 text-left transition",
                selectedId === item.id ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200 hover:bg-gray-100",
              ].join(" ")}
            >
              <div className="text-sm font-medium text-gray-900">
                {item.type === "index" ? item.index : 
                 item.type === "water" ? item.model?.toUpperCase() : 
                 "Карта риска"} • {item.type === "index" ? item.satellite : 
                 item.type === "water" ? "Water" : item.scenario}
              </div>
              <div className="mt-1 text-xs text-gray-600 truncate">{item.filename}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
