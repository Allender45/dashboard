import { ReactNode, useEffect, useState } from "react";

type SlideshowProps = {
  slides: ReactNode[];
  switchMs?: number;
};

export function Slideshow({ slides, switchMs = 30000 }: SlideshowProps) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setIdx((x) => (x + 1) % slides.length), switchMs);
    return () => window.clearInterval(t);
  }, [slides.length, switchMs]);

  const currentSlide = slides[idx] ?? slides[0];

  return (
    <div
      className="min-h-screen p-6 text-[#e8eefc] [background:radial-gradient(900px_480px_at_30%_10%,rgba(71,120,255,0.24),transparent_70%),radial-gradient(700px_420px_at_70%_40%,rgba(245,197,66,0.16),transparent_65%),radial-gradient(900px_520px_at_40%_95%,rgba(80,200,120,0.12),transparent_60%),#0b1220]"
      data-role="slideshow"
    >
      {currentSlide}
    </div>
  );
}
