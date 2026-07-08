import { SETTINGS_KEY, STORAGE_KEY } from "./data.js";

const DEFAULT_SETTINGS = { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 };

function getBrowserStorage() {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function createSavePayload(state, savedAt = new Date().toISOString()) {
  return {
    version: state.version ?? 1,
    savedAt,
    state
  };
}

export function restoreSavePayload(raw) {
  if (!raw) return null;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return parsed.state ?? parsed;
}

export function saveGameToStorage(storage, state, savedAt) {
  storage.setItem(STORAGE_KEY, JSON.stringify(createSavePayload(state, savedAt)));
}

export function loadGameFromStorage(storage) {
  return restoreSavePayload(storage.getItem(STORAGE_KEY));
}

export function saveSettingsToStorage(storage, settings) {
  storage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }));
}

export function loadSettingsFromStorage(storage) {
  const raw = storage.getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export function hasSavedGame() {
  const storage = getBrowserStorage();
  if (!storage) return false;
  return Boolean(storage.getItem(STORAGE_KEY));
}

export function saveGame(state) {
  const storage = getBrowserStorage();
  if (!storage) throw new Error("Browser storage is not available.");
  saveGameToStorage(storage, state);
}

export function loadGame() {
  const storage = getBrowserStorage();
  if (!storage) return null;
  return loadGameFromStorage(storage);
}

export function deleteSave() {
  const storage = getBrowserStorage();
  if (storage) storage.removeItem(STORAGE_KEY);
}

export function saveSettings(settings) {
  const storage = getBrowserStorage();
  if (!storage) throw new Error("Browser storage is not available.");
  saveSettingsToStorage(storage, settings);
}

export function loadSettings() {
  try {
    const storage = getBrowserStorage();
    if (!storage) return { ...DEFAULT_SETTINGS };
    return loadSettingsFromStorage(storage);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
