import { LeaderboardTable, type LeaderboardColumn, type LeaderboardRow } from "../leaderboard/LeaderboardTable";
import { TopLeaders } from "./TopLeaders";
import { PrizeFooter } from "./PrizeFooter";
import type { PodiumLeader } from "../leaderboard/Podium";

type ContestSlideProps = {
  title: string;
  period?: string;
  metric?: string;
  columns: LeaderboardColumn[];
  rows: LeaderboardRow[];
  leaders?: PodiumLeader[];
  prize?: { title: string; text: string };
  showTop?: boolean;
  showFooter?: boolean;
  isLoading?: boolean;
};

export function ContestSlide({
  title,
  period,
  metric,
  columns,
  rows,
  leaders = [],
  prize,
  showTop = true,
  showFooter = false,
  isLoading = false,
}: ContestSlideProps) {
  const hasTableData = columns.length > 0 && rows.length > 0;

  return (
    <div className="grid min-h-[calc(100vh-3rem)] grid-rows-[auto_1fr_auto] gap-4" data-role="page">
      {showTop && <TopLeaders title={title} leaders={leaders} />}

      <main
        className="grid overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
        aria-label="Таблица конкурса"
      >
        <div className="min-h-0 gap-3" data-role="table-card">
          {isLoading ? (
            <div className="grid h-full place-items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            </div>
          ) : hasTableData ? (
            <LeaderboardTable
              title={title}
              metric={metric}
              period={period}
              columns={columns}
              rows={rows}
            />
          ) : (
            <div className="grid h-full place-items-center text-center text-[18px] text-white/70">
              Данные недоступны
            </div>
          )}
        </div>
      </main>

      {showFooter && prize && <PrizeFooter title={prize.title} text={prize.text} />}
    </div>
  );
}
