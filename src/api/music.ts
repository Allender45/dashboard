// src/api/music.ts
import { getApiBase } from "./http";

const API_BASE = getApiBase();

export type MusicTrack = {
    id: number;
    name: string;
    path: string;
};

export type MusicState = {
    tracks: MusicTrack[];
    mode: "loop" | "shuffle";
};

// Получить текущее состояние (публичный эндпоинт)
export async function fetchMusicState(signal?: AbortSignal): Promise<MusicState> {
    const res = await fetch(`${API_BASE}/api/music/current`, { signal });
    if (!res.ok) throw new Error("Failed to fetch music state");
    return res.json();
}

// Загрузить новый трек (требуется токен)
export async function uploadMusic(file: File, token: string): Promise<MusicTrack> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/api/music/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Upload failed");
    }
    return res.json();
}

// Удалить трек (требуется токен)
export async function deleteMusic(id: number, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/music/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Delete failed");
    }
}

// Обновить режим воспроизведения (требуется токен)
export async function updateMusicMode(mode: "loop" | "shuffle", token: string): Promise<{ mode: "loop" | "shuffle" }> {
    const res = await fetch(`${API_BASE}/api/music/settings`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Update mode failed");
    }
    return res.json();
}