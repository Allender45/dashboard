import {LeaderboardTable, type LeaderboardColumn, type LeaderboardRow} from "../leaderboard/LeaderboardTable";
import {TopLeaders} from "./TopLeaders";
import {PrizeFooter} from "./PrizeFooter";
import type {PodiumLeader} from "../leaderboard/Podium";

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
    description?: boolean;
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
                                               description,
                                           }: DepartmentLeaderboardSlideProps) {

    return (
        <div className="grid min-h-[calc(100vh-3rem)] grid-rows-[auto_1fr_auto] gap-4" data-role="page">
            {showTop && <TopLeaders leaders={leaders}/>}

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
                {description &&
                <div className={'text-center my-[20px]'}>
                    <div className={'text-[50px] font-bold'}>🎲 Как начисляются баллы?</div>
                    <div className={'text-[30px]'}>Показатели №1, 2, 3 <br/>(физическая конверсия, возврат с лида, юр. конверсия):</div>
                    <div className={'text-[30px]'}>
                        1 место — 3 балла
                    </div>
                    <div className={'text-[30px]'}>2 место — 2 балла</div>
                    <div className={'text-[30px]'}>3 место — 1 балл</div>


                    <div className={'text-[30px]'}>Показатель №4 — прогноз выполнения плана<br/>(самый жирный):</div>
                    <div className={'text-[30px]'}>1 место — 6 баллов</div>
                    <div className={'text-[30px]'}>2 место — 4 балла</div>
                    <div className={'text-[30px]'}>3 место — 2 балла</div>


                </div>
                }
            </main>

            {
                showFooter && prize && <PrizeFooter title={prize.title} text={prize.text}/>
            }
        </div>
    )
        ;
}
