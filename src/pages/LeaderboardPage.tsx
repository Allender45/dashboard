import { useEffect, useMemo, useRef, useState } from "react";
import { Podium, type PodiumLeader } from "../components/leaderboard/Podium";
import { Legend } from "../components/leaderboard/Legend";
import { Prize } from "../components/leaderboard/Prize";
import { LeaderboardTable, type LeaderboardColumn, type LeaderboardRow } from "../components/leaderboard/LeaderboardTable";

const SWITCH_MS = 30_000;
const NEWS_IMG_SWITCH_MS = 5_000;
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

type NewsSlide = {
  id: "news";
  kind: "news";
  title: string;
  text: string;
  images: string[];
};

type ContestTvResults = {
  contest?: {
    id?: string;
    name?: string;
    period?: string;
    metric?: string;
    isPreview?: boolean;
  };
  winners?: Array<{ place?: number; employeeId?: string; employeeName?: string; value?: string; reward?: string }>;
  ranking?: Array<{ place?: number; employeeId?: string; employeeName?: string; value?: string }>;
};

type Slide = LeaderboardSlide | NewsSlide;

type LeaderboardTableData = LeaderboardSlide["table"];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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

const moneyTable: LeaderboardTableData = {
  title: "Рейтинг отделов",
  hint: "",
  columns: [
    { key: "name", label: "ФИО", align: "left" },
    { key: "plan", label: "Выполнение", align: "right" },
    { key: "conv", label: "Конверсия", align: "right" },
    { key: "profit", label: "Прибыль", align: "right" },
    { key: "growth", label: "Рост", align: "right" },
  ],
  rows: [
    { name: "Разгрузчики", plan: "128%", conv: "18,4%", profit: "1 250 000", growth: "+124" },
    { name: "Атлант", plan: "117%", conv: "16,1%", profit: "980 000", growth: "+97" },
    { name: "Артель", plan: "111%", conv: "15,6%", profit: "870 000", growth: "+83" },
    { name: "Спецпарк 24", plan: "104%", conv: "14,8%", profit: "760 000", growth: "+79" },
    { name: "Разгрузчики 2", plan: "101%", conv: "14,2%", profit: "705 000", growth: "+66" },
    { name: "Артель 2", plan: "98%", conv: "13,9%", profit: "690 000", growth: "+61" },
    { name: "Рукастер", plan: "96%", conv: "13,1%", profit: "645 000", growth: "+58" },
    { name: "Спецпарк 24-2", plan: "93%", conv: "12,7%", profit: "610 000", growth: "+52" },
    { name: "Спецпарк 24-3", plan: "90%", conv: "12,0%", profit: "575 000", growth: "+49" },
    { name: "Разгрузчики KZ", plan: "87%", conv: "11,4%", profit: "545 000", growth: "+44" },
  ],
};

const participantsTable: LeaderboardTableData = {
  title: "Конкурс",
  hint: "",
  columns: moneyTable.columns,
  rows: [
    { name: "Громов Павел", plan: "86%", conv: "10,2%", profit: "420 000", growth: "+31" },
    { name: "Котова Ирина", plan: "92%", conv: "11,7%", profit: "505 000", growth: "+38" },
    { name: "Белов Сергей", plan: "95%", conv: "12,3%", profit: "560 000", growth: "+41" },
    { name: "Лебедева Юлия", plan: "88%", conv: "10,9%", profit: "455 000", growth: "+33" },
    { name: "Морозов Виктор", plan: "91%", conv: "11,4%", profit: "490 000", growth: "+37" },
    { name: "Зайцева Елена", plan: "84%", conv: "9,8%", profit: "405 000", growth: "+28" },
    { name: "Волков Денис", plan: "89%", conv: "10,7%", profit: "470 000", growth: "+35" },
    { name: "Крылова Татьяна", plan: "93%", conv: "11,9%", profit: "520 000", growth: "+39" },
    { name: "Орехов Алексей", plan: "82%", conv: "9,5%", profit: "390 000", growth: "+26" },
    { name: "Казакова Светлана", plan: "90%", conv: "11,1%", profit: "485 000", growth: "+36" },
  ],
};

const slides: Slide[] = [
  {
    id: "leaders",
    kind: "leaderboard",
    showTop: true,
    showFooter: true,
    table: moneyTable,
    prize: {
      title: "Приз недели",
      text: "Победитель рейтинга получает сертификат номиналом 10 000 ₽. Приз выдается после закрытия недели и подтверждения результатов.",
    },
    leaders: [
      { place: 1, name: "Иванов Иван", metric: "Прибыль: 1 250 000" },
      { place: 2, name: "Петров Пётр", metric: "Прибыль: 980 000" },
      { place: 3, name: "Сидорова Анна", metric: "Прибыль: 870 000" },
    ],
  },
  {
    id: "departments",
    kind: "leaderboard",
    showTop: false,
    showFooter: false,
    showLegend: true,
    table: {
      title: "План / Факт по отделам",
      hint: "",
      columns: [
        { key: "dept", label: "Отдел", align: "left" },
        { key: "plan", label: "План", align: "right" },
        { key: "fact", label: "Факт", align: "right" },
      ],
      rows: [],
      compact: true,
      mode: "departments",
    },
  },
  {
    id: "participants",
    kind: "leaderboard",
    showTop: true,
    showFooter: true,
    table: participantsTable,
    prize: {
      title: "Приз недели",
      text: "Сертификат: 10 000 ₽. Дополнительный бонус для победителя — выходной день по согласованию с руководителем.",
    },
    leaders: [
      { place: 1, name: "Крылова Татьяна", metric: "Рост базы: +156" },
      { place: 2, name: "Белов Сергей", metric: "Рост базы: +131" },
      { place: 3, name: "Котова Ирина", metric: "Рост базы: +118" },
    ],
  },
  {
    id: "news",
    kind: "news",
    title: "ПЕРВЫЙ ПАДЕЛ-ТЕННИС В ИСТОРИИ КОМПАНИИ!",
    text:
      "Вчера, 04.02.2026, на спортивной площадке развернулись нешуточные баталии! \n" +
      "Состоялась дебютная игра в падел-теннис в рамках корпоративного чемпионата! 🎾\n\n" +
      "Ребята выложились на все 100% — было море драйва, адреналина и настоящий шквал эмоций! 💥😄\n\n" +
      "🏆Пришло время назвать имена героев : \n\n" +
      "🥇 1 МЕСТО — Александр Змерзлый! Мощно и непобедимо!\n" +
      "🥈 2 МЕСТО — Марк Архипов! Блистательная игра!\n" +
      "🥉 3 МЕСТО — Евгений Мухортиков! Отличный результат!\n\n" +
      "Ребята, вы крутые! 👏 Гордимся вашим спортивным духом и волей к победе!\n\n" +
      "Кто следующий бросит вызов чемпионам? 😉\n\n" +
      "#КорпоративныйСпорт #НашаКоманда #ПаделТеннис #Поздравляем #Чемпионы\n\n" +
      "С уважением, команда HR 🫡",
    images: ["/hr/1.jpg", "/hr/2.jpg", "/hr/3.jpg", "/hr/4.jpg", "/hr/5.jpg", "/hr/6.jpg", "/hr/7.jpg", "/hr/8.jpg"],
  },
];

export function LeaderboardPage() {
  const [idx, setIdx] = useState(0);
  const [newsImgIdx, setNewsImgIdx] = useState(0);
  const [remoteNews, setRemoteNews] = useState<NewsSlide | null>(null);
  const [remoteContestSlide, setRemoteContestSlide] = useState<LeaderboardSlide | null>(null);
  const newsInFlightRef = useRef(false);
  const contestInFlightRef = useRef(false);

  const DEFAULT_API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;
  const API_BASE = (process.env.REACT_APP_API_BASE || DEFAULT_API_BASE).replace(/\/$/, "");

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      if (newsInFlightRef.current) return;
      newsInFlightRef.current = true;
      try {
        const r = await fetch(`${API_BASE}/api/public/news/latest`, { signal: controller.signal });
        const data = r.ok ? await r.json() : null;
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
      } catch {
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
      try {
        const r = await fetch(`${API_BASE}/api/public/contest-tv/results`, { signal: controller.signal });
        const data: ContestTvResults | null = r.ok ? await r.json() : null;
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
      } catch {
      } finally {
        contestInFlightRef.current = false;
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

  const runtimeSlides = useMemo(() => {
    let base = slides;
    if (remoteContestSlide) {
      base = base.map((s) => (s.kind === "leaderboard" && s.id === "participants" ? remoteContestSlide : s));
    }
    if (!remoteNews) return base;
    const withoutNews = base.filter((s) => s.kind !== "news");
    return [...withoutNews, remoteNews];
  }, [remoteContestSlide, remoteNews]);

  useEffect(() => {
    const t = window.setInterval(() => setIdx((x) => (x + 1) % runtimeSlides.length), SWITCH_MS);
    return () => window.clearInterval(t);
  }, [runtimeSlides.length]);

  const slide = runtimeSlides[idx] ?? runtimeSlides[0];

  useEffect(() => {
    if (slide.kind !== "news") return;
    setNewsImgIdx(0);
    const t = window.setInterval(
      () => setNewsImgIdx((x) => (x + 1) % Math.max(1, slide.images.length)),
      NEWS_IMG_SWITCH_MS,
    );
    return () => window.clearInterval(t);
  }, [slide]);

  const computedTable = useMemo(() => {
    if (slide.kind !== "leaderboard") return null;
    if (slide.table.mode === "departments") {
      return { ...slide.table, rows: getDepartmentRows() };
    }
    return slide.table;
  }, [slide]);

  const tableOnly = slide.kind === "leaderboard" && !slide.showTop && !slide.showFooter;

  return (
    <div
      className={`min-h-screen p-6 text-[#e8eefc] [background:radial-gradient(900px_480px_at_30%_10%,rgba(71,120,255,0.24),transparent_70%),radial-gradient(700px_420px_at_70%_40%,rgba(245,197,66,0.16),transparent_65%),radial-gradient(900px_520px_at_40%_95%,rgba(80,200,120,0.12),transparent_60%),#0b1220] ${
        tableOnly || slide.kind === "news" ? "grid grid-rows-1" : "grid grid-rows-[20vh_60vh_15vh]"
      } gap-4`}
      data-role="page"
    >
      {slide.kind === "news" ? (
        <main
          className="grid grid-rows-[auto_1fr_auto] gap-4 overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
          aria-label="Новость"
        >
          <h1 className="text-center text-[44px] font-semibold leading-tight tracking-[0.2px]">{slide.title}</h1>

          <div className="grid min-h-0 grid-rows-[1fr_auto] gap-3">
            <div className="relative h-[46vh] overflow-hidden rounded-[14px] border border-white/10 bg-black/20">
              <img
                src={slide.images[newsImgIdx]}
                alt={`HR ${newsImgIdx + 1}`}
                className="h-full w-full object-contain"
                draggable={false}
              />
            </div>

            <div className="flex items-center justify-center gap-2">
              {slide.images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNewsImgIdx(i)}
                  className={`h-2 w-2 rounded-full transition ${i === newsImgIdx ? "bg-white/90" : "bg-white/30 hover:bg-white/50"}`}
                  aria-label={`Показать изображение ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="whitespace-pre-wrap rounded-[14px] border border-white/10 bg-white/5 p-4 text-[22px] leading-snug">
            {slide.text}
          </div>
        </main>
      ) : (
        <>
          <header
            className={`${slide.showTop ? "" : "hidden"} grid grid-rows-[auto_1fr] gap-3.5 overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.35)]`}
            data-role="top"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="m-auto text-[50px] tracking-[0.2px]">Конкурс</h1>
            </div>

            <Podium leaders={slide.leaders ?? []} />
          </header>

          <main
            className="grid overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
            aria-label="Таблица рейтинга"
          >
            <div className="min-h-0 gap-3" data-role="table-card">
              <LeaderboardTable
                title={computedTable?.title ?? ""}
                metric={computedTable?.metric ?? ""}
                period={computedTable?.period ?? ""}
                columns={computedTable?.columns ?? []}
                rows={computedTable?.rows ?? []}
                compact={computedTable?.compact}
              />
              <Legend visible={Boolean(slide.showLegend)} />
            </div>
          </main>

          <div className={slide.showFooter ? "" : "hidden"}>
            <Prize title={slide.prize?.title ?? "Приз недели"} text={slide.prize?.text ?? ""} />
          </div>
        </>
      )}
    </div>
  );
}
