import { Podium, type PodiumLeader } from "../leaderboard/Podium";

type TopLeadersProps = {
  title?: string;
  leaders: PodiumLeader[];
};

export function TopLeaders({ title = "Конкурс", leaders }: TopLeadersProps) {
  return (
    <header
      className="grid grid-rows-[auto_1fr] gap-3.5 overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
      data-role="top"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="m-auto text-[50px] tracking-[0.2px]">{title}</h1>
      </div>

      <Podium leaders={leaders} />
    </header>
  );
}
