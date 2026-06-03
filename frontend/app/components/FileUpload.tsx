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
              ? "border-emerald-400 bg-emerald-50"
              : "border-gray-300 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50"
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
            <div className="rounded-full bg-emerald-100 p-4">
              <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {fileMeta ? (
              <div className="text-center">
                <p className="font-medium text-gray-900">{fileMeta.name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {fileMeta.size} • {fileMeta.ext}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-900">Перетащите файл сюда</p>
                <p className="text-xs text-gray-600 mt-1">или кликните для выбора .tif/.tiff</p>
              </div>
            )}
          </div>
        </div>

        {/* Разделитель */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="text-xs text-gray-500">или</span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        {/* Кнопка объединения каналов */}
        <button
          type="button"
          onClick={() => setShowBandStacking(true)}
          className="mt-6 w-full rounded-2xl border border-gray-300 bg-white p-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Объединить отдельные каналы</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
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
