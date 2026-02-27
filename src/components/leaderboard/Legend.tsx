export function Legend(props: { visible: boolean }) {
  const { visible } = props;

  return (
    <div className={`${visible ? "" : "hidden"} mt-3 grid grid-cols-1 gap-2 text-[33px] text-white/70`} aria-label="Пояснение цветов">
      <div className="flex items-center gap-2.5">
        <span className="h-10 w-10 rounded-md border border-white/20 bg-white/10" aria-hidden="true" />
        План выполняется
      </div>
      <div className="flex items-center gap-2.5">
        <span className="h-10 w-10 rounded-md border border-white/20 bg-yellow-400/20" aria-hidden="true" />
        План не выполняется
      </div>
      <div className="flex items-center gap-2.5">
        <span className="h-10 w-10 rounded-md border border-white/20 bg-emerald-400/20" aria-hidden="true" />
        План перевыполняется
      </div>
    </div>
  );
}
