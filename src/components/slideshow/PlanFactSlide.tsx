import { LeaderboardTable, type LeaderboardColumn, type LeaderboardRow } from "../leaderboard/LeaderboardTable";
import { Legend } from "../leaderboard/Legend";

type PlanFactSlideProps = {
  title: string;
  columns: LeaderboardColumn[];
  rows: LeaderboardRow[];
  showLegend?: boolean;
};

export function PlanFactSlide({ title, columns, rows, showLegend = true }: PlanFactSlideProps) {
  return (
    <div className="grid grid-rows-1 gap-4" data-role="page">
      <main
        className="grid overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
        aria-label="Таблица план/факт"
      >
        <div className="min-h-0 gap-3" data-role="table-card">
          <LeaderboardTable title={title} columns={columns} rows={rows} compact />
          <Legend visible={showLegend} />
        </div>
      </main>
    </div>
  );
}
