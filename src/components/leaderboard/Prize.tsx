export function Prize(props: { title: string; text: string }) {
  const { title, text } = props;

  return (
    <footer
      className="grid items-center overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
      aria-label="Приз недели"
    >
      <div className="grid grid-cols-[220px_1fr] items-center gap-4 max-[920px]:grid-cols-1">
        <div
          className="grid min-h-[92px] place-items-center rounded-[16px] border border-white/10 [background:radial-gradient(180px_120px_at_40%_30%,rgba(245,197,66,0.22),transparent_60%),radial-gradient(210px_160px_at_70%_70%,rgba(71,120,255,0.18),transparent_60%),rgba(255,255,255,0.06)]"
          aria-hidden="true"
        >
          <div className="rounded-full border border-[rgba(245,197,66,0.35)] bg-[rgba(245,197,66,0.12)] px-3.5 py-2.5 text-[30px] font-bold">
            Сертификат
          </div>
        </div>
        <div>
          <div className="text-[50px] font-bold">{title}</div>
          <div className="mt-1.5 text-[25px] leading-[1.35] text-white/70">{text}</div>
        </div>
      </div>
    </footer>
  );
}
