import { ChangeEvent, useRef, useState } from "react";
import { BandStackingModal } from "./BandStackingModal";

interface FileUploadProps {
  file: File | null;
  fileMeta: { name: string; size: string; ext: string } | null;
  dragOver: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
}

export function FileUpload({
  file,
  fileMeta,
  dragOver,
  onFileChange,
  onDrop,
  onDragOver,
  onDragLeave,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showBandStacking, setShowBandStacking] = useState(false);

  const handleStackedFile = (stackedFile: File) => {
    // Создаём синтетическое событие для совместимости
    const syntheticEvent = {
      target: {
        files: [stackedFile]
      }
    } as unknown as ChangeEvent<HTMLInputElement>;
    
    onFileChange(syntheticEvent);
    setShowBandStacking(false);
  };

  return (
    <>
      <div className="mb-6">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`group relative cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition ${
            dragOver
              ? "border-emerald-400 bg-emerald-400/10"
              : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/[0.07]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".tif,.tiff"
            onChange={onFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-white/10 p-4">
              <svg className="h-8 w-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {fileMeta ? (
              <div className="text-center">
                <p className="font-medium">{fileMeta.name}</p>
                <p className="text-xs text-white/60 mt-1">
                  {fileMeta.size} • {fileMeta.ext}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Перетащите файл сюда</p>
                <p className="text-xs text-white/60 mt-1">или кликните для выбора .tif/.tiff</p>
              </div>
            )}
          </div>
        </div>

        {/* Разделитель */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">или</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Кнопка объединения каналов */}
        <button
          type="button"
          onClick={() => setShowBandStacking(true)}
          className="mt-6 w-full rounded-2xl border border-white/20 bg-white/5 p-4 text-sm font-medium text-white/80 transition hover:bg-white/10"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Объединить отдельные каналы</span>
          </div>
          <div className="mt-1 text-xs text-white/50">
            Загрузите спектральные каналы по отдельности
          </div>
        </button>
      </div>

      {/* Модальное окно объединения */}
      <BandStackingModal
        isOpen={showBandStacking}
        onClose={() => setShowBandStacking(false)}
        onComplete={handleStackedFile}
      />
    </>
  );
}
