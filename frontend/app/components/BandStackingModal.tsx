"use client";
import { useState, useRef, useEffect } from "react";
import { stackBands } from "../lib/api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BandFile {
  id: string;
  file: File;
  bandName: string;
  autoDetected: boolean;
}

interface SortableBandItemProps {
  band: BandFile;
  index: number;
  bandOptions: { value: string; label: string }[];
  onUpdateBandName: (id: string, bandName: string) => void;
  onRemove: (id: string) => void;
}

function SortableBandItem({ band, index, bandOptions, onUpdateBandName, onRemove }: SortableBandItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: band.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 p-4 rounded-2xl border border-gray-200"
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing"
        >
          <div className="h-10 w-10 rounded-xl bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition">
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        </div>

        <div className="flex-shrink-0 mt-1">
          <div className="h-10 w-10 rounded-xl bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">{index + 1}</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 mb-1 break-all">
            {band.file.name}
          </div>
          <div className="text-xs text-gray-600 mb-3">
            {(band.file.size / 1024 / 1024).toFixed(2)} MB
          </div>
          
          <select
            value={band.bandName}
            onChange={(e) => onUpdateBandName(band.id, e.target.value)}
            className="w-full p-2 rounded-xl bg-white border border-gray-300 text-gray-900 text-sm"
          >
            <option value="">Выберите канал</option>
            {bandOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          {band.autoDetected && band.bandName && (
            <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Автоопределение
            </div>
          )}
          
          {!band.bandName && (
            <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Требуется выбор
            </div>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={() => onRemove(band.id)}
          className="flex-shrink-0 mt-1 p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 transition"
          title="Удалить файл"
        >
          <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface BandStackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (file: File) => void;
}

const SENTINEL2_BANDS = [
  { value: "B01", label: "Coastal Aerosol (B01)" },
  { value: "B02", label: "Blue (B02)" },
  { value: "B03", label: "Green (B03)" },
  { value: "B04", label: "Red (B04)" },
  { value: "B05", label: "Red Edge 1 (B05)" },
  { value: "B06", label: "Red Edge 2 (B06)" },
  { value: "B07", label: "Red Edge 3 (B07)" },
  { value: "B08", label: "NIR (B08)" },
  { value: "B8A", label: "NIR Narrow (B8A)" },
  { value: "B09", label: "Water Vapour (B09)" },
  { value: "B11", label: "SWIR 1 (B11)" },
  { value: "B12", label: "SWIR 2 (B12)" },
];

const LANDSAT8_BANDS = [
  { value: "B1", label: "Coastal Aerosol (B1)" },
  { value: "B2", label: "Blue (B2)" },
  { value: "B3", label: "Green (B3)" },
  { value: "B4", label: "Red (B4)" },
  { value: "B5", label: "NIR (B5)" },
  { value: "B6", label: "SWIR 1 (B6)" },
  { value: "B7", label: "SWIR 2 (B7)" },
];

export function BandStackingModal({ isOpen, onClose, onComplete }: BandStackingModalProps) {
  const [step, setStep] = useState<"upload" | "assign">("upload");
  const [satellite, setSatellite] = useState("Sentinel-2");
  const [bands, setBands] = useState<BandFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showSatelliteDropdown, setShowSatelliteDropdown] = useState(false);
  const satelliteButtonRef = useRef<HTMLButtonElement>(null);
  const satelliteDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        satelliteDropdownRef.current &&
        !satelliteDropdownRef.current.contains(e.target as Node) &&
        satelliteButtonRef.current &&
        !satelliteButtonRef.current.contains(e.target as Node)
      ) {
        setShowSatelliteDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const BAND_OPTIONS = satellite === "Sentinel-2" ? SENTINEL2_BANDS : LANDSAT8_BANDS;

  const detectBand = (filename: string): string => {
    const upper = filename.toUpperCase();
    
    if (satellite === "Sentinel-2") {
      if (upper.includes("B01")) return "B01";
      if (upper.includes("B02")) return "B02";
      if (upper.includes("B03")) return "B03";
      if (upper.includes("B04")) return "B04";
      if (upper.includes("B05")) return "B05";
      if (upper.includes("B06")) return "B06";
      if (upper.includes("B07")) return "B07";
      if (upper.includes("B08")) return "B08";
      if (upper.includes("B8A")) return "B8A";
      if (upper.includes("B09")) return "B09";
      if (upper.includes("B11")) return "B11";
      if (upper.includes("B12")) return "B12";
    } else if (satellite === "Landsat-8") {
      if (upper.includes("_B1.") || upper.includes("_B1_")) return "B1";
      if (upper.includes("_B2.") || upper.includes("_B2_")) return "B2";
      if (upper.includes("_B3.") || upper.includes("_B3_")) return "B3";
      if (upper.includes("_B4.") || upper.includes("_B4_")) return "B4";
      if (upper.includes("_B5.") || upper.includes("_B5_")) return "B5";
      if (upper.includes("_B6.") || upper.includes("_B6_")) return "B6";
      if (upper.includes("_B7.") || upper.includes("_B7_")) return "B7";
    }
    
    return "";
  };

  const handleFilesSelected = (files: FileList) => {
    const newBands: BandFile[] = Array.from(files).map((file, index) => {
      const detected = detectBand(file.name);
      return {
        id: `${Date.now()}-${index}`,
        file,
        bandName: detected,
        autoDetected: !!detected
      };
    });
    
    setBands(newBands);
    setStep("assign");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelected(e.target.files);
    }
  };

  const updateBandName = (id: string, bandName: string) => {
    setBands(bands.map(b => 
      b.id === id ? { ...b, bandName, autoDetected: false } : b
    ));
  };

  const removeBand = (id: string) => {
    setBands(bands.filter(b => b.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBands((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async () => {
    if (!allBandsAssigned || !hasEnoughBands) {
      alert("Заполните все каналы");
      return;
    }

    try {
      // Используем API функцию вместо прямого fetch
      const result = await stackBands(
        bands.map(b => b.file),
        bands.map(b => b.bandName),
        satellite
      );
      
      // Скачиваем объединённый файл
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
      const fileResponse = await fetch(`${apiBase}${result.file_path}`);
      
      if (!fileResponse.ok) {
        throw new Error(`Не удалось скачать файл: ${fileResponse.status}`);
      }
      
      const fileBlob = await fileResponse.blob();
      
      // Проверяем, что файл не пустой
      if (fileBlob.size === 0) {
        throw new Error("Скачанный файл пустой");
      }
      
      const stackedFile = new File([fileBlob], "stacked.tif", { type: "image/tiff" });
      
      // Передаём файл родительскому компоненту
      onComplete(stackedFile);
      
    } catch (error) {
      alert("Ошибка: " + (error as Error).message);
    }
  };

  const allBandsAssigned = bands.every(b => b.bandName);
  const hasEnoughBands = bands.length >= 3;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl">
        {/* Шаг 1: Загрузка файлов */}
        {step === "upload" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Объединение каналов</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-2xl">×</button>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-700 mb-2">Спутник</label>
              <div className="relative">
                <button
                  ref={satelliteButtonRef}
                  type="button"
                  onClick={() => setShowSatelliteDropdown(!showSatelliteDropdown)}
                  className="w-full p-3 rounded-xl bg-white border border-gray-300 text-gray-900 text-left flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span>{satellite}</span>
                  <svg
                    className={`h-4 w-4 text-gray-600 transition-transform ${showSatelliteDropdown ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showSatelliteDropdown && (
                  <div
                    ref={satelliteDropdownRef}
                    className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[100] overflow-hidden"
                  >
                    {[
                      { value: "Sentinel-2", desc: "12 спектральных каналов" },
                      { value: "Landsat-8", desc: "7 основных каналов" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSatellite(opt.value);
                          setShowSatelliteDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition ${
                          satellite === opt.value ? "bg-emerald-50 text-emerald-900" : "text-gray-900"
                        }`}
                      >
                        <div>
                          <div className="font-medium text-sm">{opt.value}</div>
                          <div className="text-xs text-gray-500">{opt.desc}</div>
                        </div>
                        {satellite === opt.value && (
                          <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`relative rounded-2xl border-2 border-dashed p-16 text-center transition ${
                isDragging 
                  ? 'border-emerald-400 bg-emerald-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <input
                type="file"
                accept=".tif,.tiff"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              
              <div className="pointer-events-none">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100">
                  <svg className="h-10 w-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                <div className="text-lg font-medium text-gray-900 mb-2">
                  Перетащите файлы сюда
                </div>
                
                <div className="text-sm text-gray-600 mb-1">
                  или нажмите для выбора
                </div>
                
                <div className="text-xs text-gray-500">
                  Можно выбрать несколько файлов сразу
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm">
                ⓘ Загрузите все спектральные каналы одновременно
              </p>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-gray-100 text-gray-900 hover:bg-gray-200"
              >
                Отмена
              </button>
            </div>
          </>
        )}

        {/* Шаг 2: Назначение каналов */}
        {step === "assign" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Назначение каналов</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-2xl">×</button>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-sm text-gray-700">Спутник: {satellite}</div>
                <div className="text-sm text-gray-700">Загружено файлов: {bands.length}</div>
              </div>
              <button
                onClick={() => setStep("upload")}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Назад
              </button>
            </div>

            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-blue-800 text-sm flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Перетаскивайте файлы для изменения порядка каналов
              </p>
            </div>

            <div className="mb-4">
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const newFiles = Array.from(e.dataTransfer.files).map((file, index) => {
                    const detected = detectBand(file.name);
                    return {
                      id: `${Date.now()}-${index}`,
                      file,
                      bandName: detected,
                      autoDetected: !!detected
                    };
                  });
                  setBands([...bands, ...newFiles]);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                className={`relative rounded-xl border-2 border-dashed transition ${
                  isDragging 
                    ? 'border-emerald-400 bg-emerald-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <label className="relative cursor-pointer block">
                  <input
                    type="file"
                    accept=".tif,.tiff"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files).map((file, index) => {
                          const detected = detectBand(file.name);
                          return {
                            id: `${Date.now()}-${index}`,
                            file,
                            bandName: detected,
                            autoDetected: !!detected
                          };
                        });
                        setBands([...bands, ...newFiles]);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 p-4">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-gray-900 text-sm font-medium">Добавить ещё файлы</span>
                    <span className="text-gray-500 text-xs">(или перетащите сюда)</span>
                  </div>
                </label>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={bands.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="scrollbar-hide space-y-3 mb-6 max-h-[400px] overflow-y-auto">
                  {bands.map((band, index) => (
                    <SortableBandItem
                      key={band.id}
                      band={band}
                      index={index}
                      bandOptions={BAND_OPTIONS}
                      onUpdateBandName={updateBandName}
                      onRemove={removeBand}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {(() => {
              const allBandsAssigned = bands.every(b => b.bandName);
              const hasEnoughBands = bands.length >= 3;
              const has12Bands = bands.length === 12;
              
              return (
                <>
                  {allBandsAssigned && hasEnoughBands && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-green-800 text-sm flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Все каналы назначены ({bands.length}/{bands.length})
                      </p>
                    </div>
                  )}

                  {!hasEnoughBands && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-amber-800 text-sm">
                        ⚠ Для расчёта индексов нужно минимум 3 канала (загружено: {bands.length})
                      </p>
                    </div>
                  )}

                  {hasEnoughBands && !has12Bands && satellite === "Sentinel-2" && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-blue-800 text-sm">
                          <strong>Информация:</strong> Для режима "Выделение водных ресурсов" требуется ровно 12 каналов Sentinel-2 (B01-B12). Текущий файл будет работать только для расчёта индексов.
                        </div>
                      </div>
                    </div>
                  )}

                  {has12Bands && satellite === "Sentinel-2" && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-green-800 text-sm">
                          <strong>Отлично!</strong> 12 каналов Sentinel-2 — файл подходит для всех режимов, включая выделение водных ресурсов.
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 p-3 rounded-xl bg-gray-100 text-gray-900 hover:bg-gray-200"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!allBandsAssigned || !hasEnoughBands}
                      className="flex-1 p-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Объединить каналы
                    </button>
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
