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
    <div className={`flex-shrink-0 w-full md:w-64 lg:w-80 bg-white/[0.03] rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-xl transition-all ${isOpen ? 'block' : 'hidden md:block'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium">История расчётов</div>
        <button 
          onClick={onClose}
          className="md:hidden rounded-full bg-white/10 p-1"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              "w-full rounded-2xl border border-white/10 p-4 text-left transition",
              selectedId === item.id ? "bg-white/10" : "bg-white/5 hover:bg-white/[0.08]",
            ].join(" ")}
          >
            <div className="text-sm font-medium">
              {item.type === "index" ? item.index : 
               item.type === "water" ? item.model?.toUpperCase() : 
               "Карта риска"} • {item.type === "index" ? item.satellite : 
               item.type === "water" ? "Water" : item.scenario}
            </div>
            <div className="mt-1 text-xs text-white/60 truncate">{item.filename}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
