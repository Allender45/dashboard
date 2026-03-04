import { LeaderboardTable, type LeaderboardColumn, type LeaderboardRow } from "../leaderboard/LeaderboardTable";
import { TopLeaders } from "./TopLeaders";
import { PrizeFooter } from "./PrizeFooter";
import type { PodiumLeader } from "../leaderboard/Podium";

type DepartmentLeaderboardSlideProps = {
  title: string;
  period?: string;
  metric?: string;
  columns: LeaderboardColumn[];
  rows: LeaderboardRow[];
  leaders?: PodiumLeader[];
  prize?: { title: string; text: string };
  showTop?: boolean;
  showFooter?: boolean;
};

export function DepartmentLeaderboardSlide({
  title,
  period,
  metric,
  columns,
  rows,
  leaders = [],
  prize,
  showTop = true,
  showFooter = true,
}: DepartmentLeaderboardSlideProps) {
  return (
    <div className="grid min-h-[calc(100vh-3rem)] grid-rows-[auto_1fr_auto] gap-4" data-role="page">
      {showTop && <TopLeaders leaders={leaders} />}

      <main
        className="grid overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
        aria-label="Таблица рейтинга"
      >
        <div className="min-h-0 gap-3" data-role="table-card">
          <LeaderboardTable
            title={title}
            metric={metric}
            period={period}
            columns={columns}
            rows={rows}
          />
        </div>
      </main>

      {showFooter && prize && <PrizeFooter title={prize.title} text={prize.text} />}
    </div>
  );
}
