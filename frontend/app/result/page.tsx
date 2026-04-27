"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { HistorySidebar } from "./components/HistorySidebar";
import { ResultHeader } from "./components/ResultHeader";
import { SummaryCard } from "./components/SummaryCard";
import { PreviewCard } from "./components/PreviewCard";

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

interface MetaData {
  id: string;
  filename: string;
  scenario?: string;
  normalization_type?: string;
  calculated_indices?: string[];
  stats: {
    safe_percent?: number;
    medium_percent?: number;
    danger_percent?: number;
  };
  message: string;
}

export default function ResultPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("calculationHistory");
    if (!data) {
      router.push("/");
      return;
    }
    try {
      const parsed: HistoryEntry[] = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        router.push("/");
        return;
      }
      const sorted = [...parsed].sort((a, b) => b.timestamp - a.timestamp);
      setHistory(sorted);
      setSelectedId(sorted[0].id);
    } catch {
      router.push("/");
    }
  }, [router]);

  // Загрузка meta.json для статистики
  useEffect(() => {
    if (!selectedId) {
      setMeta(null);
      return;
    }

    setLoadingMeta(true);
    fetch(`/data/results/${selectedId}/meta.json`)
      .then(res => {
        if (!res.ok) throw new Error("Meta not found");
        return res.json();
      })
      .then(setMeta)
      .catch(() => setMeta(null))
      .finally(() => setLoadingMeta(false));
  }, [selectedId]);

  const entry = history.find(h => h.id === selectedId);

  const previewUrl = selectedId ? `/data/results/${selectedId}/preview.png` : null;
  const tiffUrl = selectedId ? `/data/results/${selectedId}/result.tif` : null;

  const handleDownload = (url: string | null, filename: string) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleNewCalculation = () => {
    localStorage.removeItem("calculationHistory");
    router.push("/");
  };

  const handleBack = () => router.push("/");

  const handleSelectHistory = (id: string) => {
    setSelectedId(id);
    setIsSidebarOpen(false);
  };

  if (!entry) return null;

  return (
    <>
      <Header />
      <div className="min-h-screen w-full bg-neutral-950 text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-48 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-10 flex gap-6 flex-col md:flex-row">
        <HistorySidebar
          history={history}
          selectedId={selectedId}
          isOpen={isSidebarOpen}
          onSelect={handleSelectHistory}
          onClose={() => setIsSidebarOpen(false)}
        />

        <button 
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed bottom-4 left-4 z-10 md:hidden rounded-full bg-white/10 p-3 shadow-lg ${isSidebarOpen ? 'hidden' : 'block'}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex-1">
          <ResultHeader
            entry={entry}
            onBack={handleBack}
            onNewCalculation={handleNewCalculation}
          />

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <SummaryCard
              entry={entry}
              meta={meta}
              loadingMeta={loadingMeta}
              tiffUrl={tiffUrl}
              previewUrl={previewUrl}
              onDownload={handleDownload}
            />

            <PreviewCard
              entry={entry}
              previewUrl={previewUrl}
              selectedId={selectedId}
              onDownload={handleDownload}
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
            <div>© {new Date().getFullYear()} Satellite Indices</div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Next.js + Tailwind
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Results on server
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}