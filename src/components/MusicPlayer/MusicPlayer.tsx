import * as React from "react";
import { useMusicPlayer } from "../../hooks/useMusicPlayer";

export const MusicPlayer: React.FC = () => {
    const { isPlaying, play, pause, next, tracks, currentIndex } = useMusicPlayer();

    // Если нет треков, не показываем плеер
    if (!tracks.length) return null;

    return (
        <div className="hidden bottom-20 right-4 z-50 items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-white backdrop-blur">
            <button
                onClick={isPlaying ? pause : play}
                className="hover:opacity-80"
                title={isPlaying ? "Пауза" : "Воспроизвести"}
            >
                {isPlaying ? "⏸" : "▶️"}
            </button>
            <button onClick={next} className="hover:opacity-80" title="Следующий трек">
                ⏭
            </button>
            <span className="text-xs opacity-70">
        {currentIndex + 1}/{tracks.length}
      </span>
        </div>
    );
};