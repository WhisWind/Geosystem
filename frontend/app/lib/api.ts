const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const API_URL_INDEX = `${API_BASE}/api/index`;
const API_URL_WATER = `${API_BASE}/api/water`;
const API_URL_EXPORT = `${API_BASE}/api/export`;
const API_URL_RISK = `${API_BASE}/api/risk`;

export async function calculateIndex(
  file: File,
  satellite: string,
  index: string
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type_satellite", satellite);
  formData.append("index", index);
  
  const res = await fetch(`${API_URL_INDEX}/calculate`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.detail || err.message || "Ошибка сервера";
    throw new Error(message);
  }

  return res.json(); // ожидается { id, meta, ... }
}

export async function assessRisk(
  file: File,
  scenario: string,
  normalizationType: string = "linear",
  safeThreshold: number = 0.3,
  dangerThreshold: number = 0.7
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("scenario", scenario);
  formData.append("normalization_type", normalizationType);
  formData.append("safe_threshold", safeThreshold.toString());
  formData.append("danger_threshold", dangerThreshold.toString());

  const res = await fetch(`${API_URL_RISK}/assess`, {  // ← правильный путь
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.detail || err.message || "Ошибка сервера";
    throw new Error(message);
  }

  return res.json();
}

export async function segmentWater(
  file: File,
  modelKey: string,
  threshold: number
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model_key", modelKey);
  formData.append("threshold", threshold.toString());
  
  const res = await fetch(`${API_URL_WATER}/calculate`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.detail || err.message || "Ошибка сервера";
    throw new Error(message);
  }

  return res.json(); // { id, meta, ... }
}
export async function exportGeoTiff(payload: any) {
  const res = await fetch(`${API_URL_EXPORT}/geotiff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || "Ошибка экспорта");
  }

  return res.json();
}

export async function getResultById(id: string) {
  const res = await fetch(`${API_BASE}/data/results/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Не удалось загрузить результат");
  }
  return res.json();
}