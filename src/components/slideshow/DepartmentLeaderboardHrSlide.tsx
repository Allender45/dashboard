import {LeaderboardTable, type LeaderboardColumn, type LeaderboardRow} from "../leaderboard/LeaderboardTable";
import type {PodiumLeader} from "../leaderboard/Podium";

type DepartmentLeaderboardHrSlide = {
    title: string;
    period?: string;
    metric?: string;
    columns: LeaderboardColumn[];
    rows: LeaderboardRow[];
    leaders?: PodiumLeader[];
    prize?: { title: string; text: string };
    showTop?: boolean;
    showFooter?: boolean;
    description?: boolean;
};

export function DepartmentLeaderboardHrSlide({
                                                 title,
                                                 period,
                                                 metric,
                                                 columns,
                                                 rows,
                                             }: DepartmentLeaderboardHrSlide) {
    return (
        <div className="grid h-full grid-rows-[auto_1fr_auto] gap-4" data-role="page">
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
                        fontSize={20}
                        prizePlaces={1}
                        rowLeaders={true}
                    />
                </div>
            </main>
        </div>
    );
}
