import { useState, useEffect } from "react";

type NewsSlideProps = {
  title: string;
  text: string;
  images: string[];
  imageSwitchMs?: number;
};

export function NewsSlide({ title, text, images, imageSwitchMs = 5000 }: NewsSlideProps) {
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    setImgIdx(0);
    const t = window.setInterval(
      () => setImgIdx((x) => (x + 1) % Math.max(1, images.length)),
      imageSwitchMs,
    );
    return () => window.clearInterval(t);
  }, [images, imageSwitchMs]);

  return (
    <div className="grid grid-rows-1 gap-4" data-role="page">
      <main
        className="grid grid-rows-[auto_1fr_auto] gap-4 overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
        aria-label="Новость"
      >
        <h1 className="text-center text-[44px] font-semibold leading-tight tracking-[0.2px]">{title}</h1>

        <div className="grid min-h-0 grid-rows-[1fr_auto] gap-3">
          <div className="relative h-[46vh] overflow-hidden rounded-[14px] border border-white/10 bg-black/20">
            <img
              src={images[imgIdx]}
              alt={`HR ${imgIdx + 1}`}
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setImgIdx(i)}
                className={`h-2 w-2 rounded-full transition ${i === imgIdx ? "bg-white/90" : "bg-white/30 hover:bg-white/50"}`}
                aria-label={`Показать изображение ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="whitespace-pre-wrap rounded-[14px] border border-white/10 bg-white/5 p-4 text-[22px] leading-snug">
          {text}
        </div>
      </main>
    </div>
  );
}
