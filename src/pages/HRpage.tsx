import { useEffect, useMemo, useRef, useState } from "react";
import { type PodiumLeader } from "../components/leaderboard/Podium";
import {
    type LeaderboardColumn,
    type LeaderboardRow,
    LeaderboardTable
} from "../components/leaderboard/LeaderboardTable";
import { env, requireEnv } from "../config/env";
import { useDepartmentMetricsTable } from "../hooks/useSheetTable";
import { DepartmentLeaderboardHrSlide } from "../components/slideshow/DepartmentLeaderboardHrSlide";
import { ContestSlide } from "../components/slideshow/ContestSlide";
import { getApiBase } from "../api/http";
import { fetchContestTvResults } from "../api/public";
import {ContestHrSlide} from "../components/slideshow/ContestHrSlide";

const REFRESH_MS = 10 * 60_000;

type LeaderboardSlide = {
    id: "leaders" | "departments" | "participants";
    kind: "leaderboard";
    showTop: boolean;
    showFooter: boolean;
    showLegend?: boolean;
    leaders?: PodiumLeader[];
    prize?: { title: string; text: string };
    table: {
        title: string;
        hint: string;
        period?: string;
        metric?: string;
        columns: LeaderboardColumn[];
        rows: LeaderboardRow[];
        compact?: boolean;
        mode?: "departments";
    };
};

export function HRpage() {
    const [remoteContestSlide, setRemoteContestSlide] = useState<LeaderboardSlide | null>(null);
    const [isContestLoading, setIsContestLoading] = useState(true);
    const contestInFlightRef = useRef(false);

    const sheetsInput = useMemo(() => {
        try {
            return {
                spreadsheetId: requireEnv("REACT_APP_SHEETS_SPREADSHEET_ID", env.spreadsheetId),
                gid: requireEnv("REACT_APP_SHEETS_GID", env.gid),
            };
        } catch {
            return null;
        }
    }, []);

    const sheetTableState = useDepartmentMetricsTable(sheetsInput ?? { spreadsheetId: "", gid: "" });

    const API_BASE = useMemo(() => getApiBase(), []);

    useEffect(() => {
        const controller = new AbortController();

        async function loadContest() {
            if (contestInFlightRef.current) return;
            contestInFlightRef.current = true;
            setIsContestLoading(true);
            try {
                const data = await fetchContestTvResults(controller.signal);
                if (!data) return;

                const contestName = String(data.contest?.name ?? "Конкурс");
                const period = String(data.contest?.period ?? "");
                const metric = String(data.contest?.metric ?? "");

                const winners = Array.isArray(data.winners) ? data.winners : [];
                const leaders: PodiumLeader[] = winners
                    .filter((x) => x && (x.place === 1 || x.place === 2 || x.place === 3))
                    .map((x) => {
                        const place = x.place as 1 | 2 | 3;
                        const name = String(x.employeeName ?? "");
                        const value = String(x.value ?? "");
                        const reward = String(x.reward ?? "");
                        const metricText = [value, reward].filter((s) => Boolean(String(s).trim())).join(" · ");
                        return { place, name, metric: metricText };
                    });

                const ranking = Array.isArray(data.ranking) ? data.ranking : [];
                const rows: LeaderboardRow[] = ranking.map((x) => ({
                    place: String(x?.place ?? ""),
                    name: String(x?.employeeName ?? ""),
                    value: String(x?.value ?? ""),
                }));

                setRemoteContestSlide({
                    id: "participants",
                    kind: "leaderboard",
                    showTop: true,
                    showFooter: false,
                    leaders,
                    table: {
                        title: contestName,
                        hint: "",
                        period,
                        metric,
                        columns: [
                            { key: "place", label: "Место", align: "left" },
                            { key: "name", label: "ФИО", align: "center" },
                            { key: "value", label: "Результат", align: "right" },
                        ],
                        rows,
                    },
                });
            } catch (e) {
                console.error("Failed to load contest-tv results", e);
            } finally {
                contestInFlightRef.current = false;
                setIsContestLoading(false);
            }
        }

        loadContest();
        const t = window.setInterval(loadContest, REFRESH_MS);
        return () => {
            window.clearInterval(t);
            controller.abort();
            contestInFlightRef.current = false;
        };
    }, [API_BASE]);

    const departmentLeaderboardData = useMemo(() => {
        if (sheetTableState.status !== "success") {
            return { columns: [], rows: [], period: "", leaders: [] };
        }
        const t = sheetTableState.data;
        const columns: LeaderboardColumn[] = t.headers.map((label, i) => {
            const key = `c${i}`;
            return {
                key,
                label: String(label || ""),
                align: i === 0 ? "left" : "right",
            };
        });

        const sortedByPoints = [...t.rows].sort((a, b) => {
            const pointsA = parseFloat(String(a.points).replace(/[^\d.-]/g, "")) || 0;
            const pointsB = parseFloat(String(b.points).replace(/[^\d.-]/g, "")) || 0;
            return pointsB - pointsA;
        });

        const rows: LeaderboardRow[] = sortedByPoints.map((r) => ({
            c0: r.department,
            c1: r.convPhys,
            c2: r.leadReturn,
            c3: r.convJur,
            c4: r.planForecast,
            c5: r.points,
        }));

        const leaders: PodiumLeader[] = [];
        let place = 0;
        let lastPoints: number | null = null;
        for (const r of sortedByPoints) {
            const points = parseFloat(String(r.points).replace(/[^\d.-]/g, "")) || 0;
            if (lastPoints === null || points !== lastPoints) {
                place += 1;
                lastPoints = points;
            }
            if (place > 3) break;
            leaders.push({
                place: place as 1 | 2 | 3,
                name: String(r.department),
                metric: `Баллы: ${String(r.points)}`,
            });
        }

        return { columns, rows, period: t.period, leaders };
    }, [sheetTableState]);

    const contestData = useMemo(() => {
        if (remoteContestSlide) {
            return {
                title: remoteContestSlide.table.title,
                period: remoteContestSlide.table.period,
                metric: remoteContestSlide.table.metric,
                columns: remoteContestSlide.table.columns,
                rows: remoteContestSlide.table.rows,
                leaders: remoteContestSlide.leaders ?? [],
                prize: remoteContestSlide.prize,
                showTop: remoteContestSlide.showTop,
                showFooter: remoteContestSlide.showFooter,
                isLoading: isContestLoading,
            };
        }
        return {
            title: "Конкурс",
            period: "",
            metric: "",
            columns: [],
            rows: [],
            leaders: [],
            prize: undefined,
            showTop: true,
            showFooter: false,
            isLoading: isContestLoading,
        };
    }, [remoteContestSlide, isContestLoading]);

    const renderSlides = useMemo(() => {
        const slideComponents = [
            <DepartmentLeaderboardHrSlide
                key="leaders"
                title="Рейтинг отделов"
                period={departmentLeaderboardData.period}
                columns={departmentLeaderboardData.columns}
                rows={departmentLeaderboardData.rows}
                leaders={departmentLeaderboardData.leaders}
                prize={{
                    title: "Приз",
                    text: "50 000₽ в копилку отдела, уважение и почитание.",
                }}
                description={true}
            />,
            <ContestSlide
                key="contest"
                title={contestData.title}
                period={contestData.period}
                metric={contestData.metric}
                columns={contestData.columns}
                rows={contestData.rows}
                leaders={contestData.leaders}
                prize={contestData.prize}
                showTop={contestData.showTop}
                showFooter={contestData.showFooter}
                isLoading={contestData.isLoading}
            />,
        ];

        return slideComponents;
    }, [departmentLeaderboardData, contestData]);

    return (
        <div className="flex flex-col  bg-[#0b1220]">
            <div className="flex-1 min-h-0 overflow-hidden">
                <div className="grid h-full grid-rows-[auto_1fr_auto] gap-4" data-role="page">
                    <main
                        className="grid overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
                        aria-label="Таблица рейтинга"
                    >
                        <div className="min-h-0 gap-3 text-white" data-role="table-card">
                            <LeaderboardTable
                                title="Рейтинг отделов"
                                period={departmentLeaderboardData.period}
                                columns={departmentLeaderboardData.columns}
                                rows={departmentLeaderboardData.rows}
                                fontSize={20}
                                prizePlaces={1}
                                rowLeaders={true}
                            />

                            <LeaderboardTable
                                title={contestData.title}
                                period={contestData.period}
                                metric={contestData.metric}
                                columns={contestData.columns}
                                rows={contestData.rows}
                                fontSize={20}
                                prizePlaces={1}
                                rowLeaders={true}
                            />
                        </div>
                    </main>
                </div>
            </div>

        </div>
    );
}
