export function Prize(props: { title: string; text: string }) {
  const { title, text } = props;

  return (
    <footer
      className="grid items-center overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
      aria-label="Приз недели"
    >
      <div className="">
        <div>
          <div className="text-[50px] font-bold">{title}</div>
          <div className="mt-1.5 text-[25px] leading-[1.35] text-white/70">{text}</div>
        </div>
      </div>
    </footer>
  );
}
