import { useEffect, useMemo, useRef, useState } from "react";
import { type PodiumLeader } from "../components/leaderboard/Podium";
import { type LeaderboardColumn, type LeaderboardRow } from "../components/leaderboard/LeaderboardTable";
import { Slideshow } from "../components/slideshow/Slideshow";
import { DepartmentLeaderboardSlide } from "../components/slideshow/DepartmentLeaderboardSlide";
import { PlanFactSlide } from "../components/slideshow/PlanFactSlide";
import { ContestSlide } from "../components/slideshow/ContestSlide";
import { FooterClock } from "../components/FooterClock/FooterClock";
import { NewsSlide } from "../components/slideshow/NewsSlide";
import { getApiBase } from "../api/http";
import { fetchContestTvResults, fetchPublicNewsLatest, fetchTeamBattleLeaderboard } from "../api/public";
import { MusicPlayer } from "../components/MusicPlayer/MusicPlayer";
import { IframeSlide } from "../components/slideshow/IframeSlide";

const SWITCH_MS = 5_000;
const REFRESH_MS = 10 * 60_000;
const BATTLE_PORTAL_URL = `${getApiBase()}/battle-frame`;

type LeaderboardSlide = {
  id: string;
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

type NewsSlide = {
  id: "news";
  kind: "news";
  title: string;
  text: string;
  images: string[];
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatMetricValue(value: unknown, format: unknown): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? "");
  const rounded = Number.isInteger(num) ? num : Math.round(num * 100) / 100;
  return format === "percent" ? `${rounded}%` : String(rounded);
}

function formatPeriodRu(start: unknown, end: unknown): string {
  const fmt = (s: unknown) => {
    const parts = String(s ?? "").split("-");
    if (parts.length !== 3) return String(s ?? "");
    const [y, m, d] = parts;
    return `${d}.${m}.${y}`;
  };
  const a = fmt(start);
  const b = fmt(end);
  return a && b ? `${a} — ${b}` : a || b;
}

function getDepartmentRows(): LeaderboardRow[] {
  const departments = [
    "Разгрузчики",
    "Атлант",
    "Артель",
    "Розница",
    "B2B",
    "B2C",
    "Логистика",
    "Контакт-центр",
    "Партнёры",
    "Развитие",
  ];

  const rows: LeaderboardRow[] = [];
  for (let i = 0; i < 10; i++) {
    const dept = departments[i] ?? `Отдел ${i + 1}`;
    const plan = randInt(120_000, 980_000);
    const fact = randInt(60_000, 1_250_000);

    let status = "[&>td]:bg-white/5";
    if (fact < plan) status = "[&>td]:bg-yellow-400/10";
    if (fact > plan) status = "[&>td]:bg-emerald-400/10";

    rows.push({ dept, plan: formatNumber(plan), fact: formatNumber(fact), __rowClass: status });
  }
  return rows;
}

export function LeaderboardPage() {
  const [remoteNews, setRemoteNews] = useState<NewsSlide | null>(null);
  const [remoteContestSlides, setRemoteContestSlides] = useState<LeaderboardSlide[]>([]);
  const [isContestLoading, setIsContestLoading] = useState(true);
  const [remoteTeamBattle, setRemoteTeamBattle] = useState<LeaderboardSlide | null>(null);
  const newsInFlightRef = useRef(false);
  const contestInFlightRef = useRef(false);
  const teamBattleInFlightRef = useRef(false);

  const API_BASE = useMemo(() => getApiBase(), []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      if (newsInFlightRef.current) return;
      newsInFlightRef.current = true;
      try {
        const data = await fetchPublicNewsLatest(controller.signal);
        const n = (data as any)?.news;
        if (!n) return;

        const images = Array.isArray(n.images)
          ? n.images
              .map((x: any) => x?.path)
              .filter(Boolean)
              .map((p: string) => (String(p).startsWith("http") ? String(p) : `${API_BASE}${String(p)}`))
          : [];
        setRemoteNews({
          id: "news",
          kind: "news",
          title: String(n.title ?? ""),
          text: String(n.text ?? ""),
          images,
        });
      } catch (e) {
        if (controller.signal.aborted) return;
        console.error("Failed to load news", e);
      } finally {
        newsInFlightRef.current = false;
      }
    }

    loadNews();
    const t = window.setInterval(loadNews, REFRESH_MS);
    return () => {
      window.clearInterval(t);
      controller.abort();
      newsInFlightRef.current = false;
    };
  }, [API_BASE]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadContest() {
      if (contestInFlightRef.current) return;
      contestInFlightRef.current = true;
      setIsContestLoading(true);
      try {
        const data = await fetchContestTvResults(controller.signal);
        if (!data) return;

        const contests = Array.isArray(data.contests) ? data.contests : [];

        const slides: LeaderboardSlide[] = contests.map((item, index) => {
          const contestName = String(item?.contest?.name ?? "Конкурс");
          const period = String(item?.contest?.period ?? "");
          const metric = String(item?.contest?.metric ?? "");
          const contestId = item?.contest?.id ? String(item.contest.id) : String(index);

          const winners = Array.isArray(item?.winners) ? item.winners : [];
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

          const ranking = Array.isArray(item?.ranking) ? item.ranking : [];
          const rows: LeaderboardRow[] = ranking.map((x) => ({
            place: String(x?.place ?? ""),
            name: String(x?.employeeName ?? ""),
            value: String(x?.value ?? ""),
          }));

          return {
            id: contestId,
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
          };
        });

        setRemoteContestSlides(slides);
      } catch (e) {
        if (controller.signal.aborted) return;
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

  useEffect(() => {
    const controller = new AbortController();

    async function loadTeamBattle() {
      if (teamBattleInFlightRef.current) return;
      teamBattleInFlightRef.current = true;
      try {
        const res = await fetchTeamBattleLeaderboard(controller.signal);
        const data = res?.data;
        if (!data) return;

        const contestName = String(data.contest?.name ?? "Рейтинг отделов");
        const period = formatPeriodRu(data.contest?.period?.start, data.contest?.period?.end);
        const prizeText = data.contest?.prize ? String(data.contest.prize) : "";

        const formulaMetrics = Array.isArray(data.formula_metrics) ? data.formula_metrics : [];
        const columns: LeaderboardColumn[] = [
          { key: "c0", label: "Отдел", align: "left" },
          ...formulaMetrics.map((m, i) => ({
            key: `c${i + 1}`,
            label: String(m?.type ?? ""),
            align: "right" as const,
          })),
          { key: `c${formulaMetrics.length + 1}`, label: "Баллы", align: "right" as const },
        ];

        const rankings = Array.isArray(data.rankings) ? data.rankings : [];
        const rows: LeaderboardRow[] = rankings.map((r) => {
          const row: LeaderboardRow = { c0: String(r?.department ?? "") };
          formulaMetrics.forEach((m, i) => {
            const metricKey = String(m?.type ?? "");
            row[`c${i + 1}`] = formatMetricValue(r?.metrics?.[metricKey], m?.format);
          });
          row[`c${formulaMetrics.length + 1}`] = String(r?.score ?? "");
          return row;
        });

        const leaders: PodiumLeader[] = rankings
            .filter((r) => r?.rank === 1 || r?.rank === 2 || r?.rank === 3)
            .map((r) => ({
              place: r.rank as 1 | 2 | 3,
              name: String(r?.department ?? ""),
              metric: `Баллы: ${String(r?.score ?? "")}`,
            }));

        setRemoteTeamBattle({
          id: "departments",
          kind: "leaderboard",
          showTop: true,
          showFooter: Boolean(prizeText),
          leaders,
          prize: prizeText ? { title: "Приз", text: prizeText } : undefined,
          table: {
            title: contestName,
            hint: "",
            period,
            columns,
            rows,
          },
        });
      } catch (e) {
        if (controller.signal.aborted) return;
        console.error("Failed to load team-battle-leaderboard", e);
      } finally {
        teamBattleInFlightRef.current = false;
      }
    }

    loadTeamBattle();
    const t = window.setInterval(loadTeamBattle, REFRESH_MS);
    return () => {
      window.clearInterval(t);
      controller.abort();
      teamBattleInFlightRef.current = false;
    };
  }, [API_BASE]);

  const departmentLeaderboardData = useMemo(() => {
    if (!remoteTeamBattle) {
      return { columns: [], rows: [], period: "", leaders: [], prize: undefined as { title: string; text: string } | undefined };
    }
    return {
      columns: remoteTeamBattle.table.columns,
      rows: remoteTeamBattle.table.rows,
      period: remoteTeamBattle.table.period ?? "",
      leaders: remoteTeamBattle.leaders ?? [],
      prize: remoteTeamBattle.prize,
    };
  }, [remoteTeamBattle]);

  const planFactData = useMemo(() => {
    return {
      columns: [
        { key: "dept", label: "Отдел", align: "left" as const },
        { key: "plan", label: "План", align: "right" as const },
        { key: "fact", label: "Факт", align: "right" as const },
      ],
      rows: getDepartmentRows(),
    };
  }, []);

  const contestSlidesData = useMemo(() => {
    return remoteContestSlides.map((slide) => ({
      id: slide.id,
      title: slide.table.title,
      period: slide.table.period,
      metric: slide.table.metric,
      columns: slide.table.columns,
      rows: slide.table.rows,
      leaders: slide.leaders ?? [],
      prize: slide.prize,
      showTop: slide.showTop,
      showFooter: slide.showFooter,
    }));
  }, [remoteContestSlides]);

  const renderSlides = useMemo(() => {
    const slideComponents = [
      // <DepartmentLeaderboardSlide
      //     key="leaders"
      //     title="Рейтинг отделов"
      //     period={departmentLeaderboardData.period}
      //     columns={departmentLeaderboardData.columns}
      //     rows={departmentLeaderboardData.rows}
      //     leaders={departmentLeaderboardData.leaders}
      //     prize={departmentLeaderboardData.prize}
      //     showFooter={Boolean(departmentLeaderboardData.prize)}
      //     description={true}
      // />,
    ];

    slideComponents.push(
        <IframeSlide
            key="battle-portal"
            src={BATTLE_PORTAL_URL}
            title="Битва отделов"
        />,
    );

    if (contestSlidesData.length > 0) {
      for (const contest of contestSlidesData) {
        slideComponents.push(
            <ContestSlide
                key={`contest-${contest.id}`}
                title={contest.title}
                period={contest.period}
                metric={contest.metric}
                columns={contest.columns}
                rows={contest.rows}
                leaders={contest.leaders}
                prize={contest.prize}
                showTop={contest.showTop}
                showFooter={contest.showFooter}
                isLoading={isContestLoading}
            />,
        );
      }
    } else {
      slideComponents.push(
          <ContestSlide
              key="contest-empty"
              title="Конкурс"
              period=""
              metric=""
              columns={[]}
              rows={[]}
              leaders={[]}
              prize={undefined}
              showTop={true}
              showFooter={false}
              isLoading={isContestLoading}
          />,
      );
    }

    if (remoteNews) {
      slideComponents.push(
          <NewsSlide
              key="news"
              title={remoteNews.title}
              text={remoteNews.text}
              images={remoteNews.images}
          />,
      );
    }

    return slideComponents;
  }, [departmentLeaderboardData, contestSlidesData, isContestLoading, remoteNews]);

  return (
      <div className="flex flex-col h-screen bg-[#0b1220]">
        <div className="flex-1 min-h-0 overflow-hidden">
          <Slideshow slides={renderSlides} switchMs={SWITCH_MS} />
        </div>
        <FooterClock />
        <MusicPlayer />
      </div>
  );
}
