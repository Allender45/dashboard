// src/hooks/useMusicPlayer.ts
import { useEffect, useRef, useState } from "react";
import { fetchMusicState, MusicTrack } from "../api/music";
import { getApiBase } from "../api/http";

const API_BASE = getApiBase();

function shuffleIndices(length: number): number[] {
    const arr = Array.from({ length }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function useMusicPlayer() {
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [mode, setMode] = useState<"loop" | "shuffle">("loop");
    const [repeat, setRepeat] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const initializedRef = useRef(false);
    const queueRef = useRef<number[]>([]);
    const queuePosRef = useRef(0);

    // Загрузка списка треков и настроек
    useEffect(() => {
        const controller = new AbortController();
        fetchMusicState(controller.signal)
            .then((state) => {
                setTracks(state.tracks);
                setMode(state.mode);
                setRepeat(state.repeat);
                if (state.tracks.length > 0 && currentIndex >= state.tracks.length) {
                    setCurrentIndex(0);
                }
            })
            .catch((e) => console.error("Failed to load music state", e));
        return () => controller.abort();
    }, []);

    // Пересборка очереди воспроизведения при смене треков/режима порядка
    useEffect(() => {
        if (!tracks.length) {
            queueRef.current = [];
            queuePosRef.current = 0;
            return;
        }
        queueRef.current = mode === "shuffle" ? shuffleIndices(tracks.length) : tracks.map((_, i) => i);
        queuePosRef.current = 0;
        setCurrentIndex(queueRef.current[0]);
    }, [tracks.length, mode]);

    // Переход к следующему треку в очереди; при исчерпании очереди — либо повтор, либо стоп
    function advance(): number | null {
        if (!queueRef.current.length) return null;
        const nextPos = queuePosRef.current + 1;

        if (nextPos < queueRef.current.length) {
            queuePosRef.current = nextPos;
            return queueRef.current[nextPos];
        }

        if (!repeat) return null;

        queueRef.current = mode === "shuffle" ? shuffleIndices(tracks.length) : tracks.map((_, i) => i);
        queuePosRef.current = 0;
        return queueRef.current[0];
    }

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

        const audio = new Audio(`${API_BASE}${track.path}`);
        audioRef.current = audio;

        const handleEnded = () => {
            const nextIndex = advance();
            if (nextIndex === null) {
                setIsPlaying(false);
                return;
            }
            setCurrentIndex(nextIndex);
        };

        audio.addEventListener("ended", handleEnded);

        if (initializedRef.current) {
            audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }

        return () => {
            audio.removeEventListener("ended", handleEnded);
            audio.pause();
            audio.src = "";
        };
    }, [tracks, currentIndex]);

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
        const nextIndex = advance();
        if (nextIndex === null) return;
        setCurrentIndex(nextIndex);
    };

    return { tracks, currentIndex, isPlaying, play, pause, next };
}