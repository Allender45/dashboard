// src/hooks/useMusicPlayer.ts
import { useEffect, useRef, useState } from "react";
import { fetchMusicState, MusicTrack } from "../api/music";
import { getApiBase } from "../api/http";

const API_BASE = getApiBase();

export function useMusicPlayer() {
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [mode, setMode] = useState<"loop" | "shuffle">("loop");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const initializedRef = useRef(false); // чтобы не дублировать инициализацию

    // Загрузка списка треков и режима
    useEffect(() => {
        const controller = new AbortController();
        fetchMusicState(controller.signal)
            .then((state) => {
                setTracks(state.tracks);
                setMode(state.mode);
                if (state.tracks.length > 0 && currentIndex >= state.tracks.length) {
                    setCurrentIndex(0);
                }
            })
            .catch((e) => console.error("Failed to load music state", e));
        return () => controller.abort();
    }, []);

    // Инициализация плеера при изменении треков или индекса
    useEffect(() => {
        if (!tracks.length) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
            setIsPlaying(false);
            return;
        }

        const track = tracks[currentIndex];
        if (!track) return;

        // Создаём Audio, но пока не запускаем
        const audio = new Audio(`${API_BASE}${track.path}`);
        audioRef.current = audio;

        const handleEnded = () => {
            if (mode === "loop") {
                setCurrentIndex((prev) => (prev + 1) % tracks.length);
            } else {
                const next = Math.floor(Math.random() * tracks.length);
                setCurrentIndex(next);
            }
        };

        audio.addEventListener("ended", handleEnded);

        // Если уже был инициирован запуск – пробуем play
        if (initializedRef.current) {
            audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }

        return () => {
            audio.removeEventListener("ended", handleEnded);
            audio.pause();
            audio.src = "";
        };
    }, [tracks, currentIndex, mode]);

    // Эффект для перехвата первого клика и запуска музыки
    useEffect(() => {
        if (initializedRef.current) return;
        if (!tracks.length) return;

        const handleFirstInteraction = () => {
            if (audioRef.current) {
                audioRef.current.play()
                    .then(() => {
                        setIsPlaying(true);
                        initializedRef.current = true;
                    })
                    .catch(() => {});
            }
            // Удаляем слушатели после первого клика
            document.removeEventListener("click", handleFirstInteraction);
            document.removeEventListener("touchstart", handleFirstInteraction);
        };

        document.addEventListener("click", handleFirstInteraction);
        document.addEventListener("touchstart", handleFirstInteraction);

        return () => {
            document.removeEventListener("click", handleFirstInteraction);
            document.removeEventListener("touchstart", handleFirstInteraction);
        };
    }, [tracks]);

    const play = () => {
        if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
    };

    const pause = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const next = () => {
        if (!tracks.length) return;
        if (mode === "loop") {
            setCurrentIndex((prev) => (prev + 1) % tracks.length);
        } else {
            setCurrentIndex(Math.floor(Math.random() * tracks.length));
        }
    };

    return { tracks, currentIndex, isPlaying, play, pause, next };
}