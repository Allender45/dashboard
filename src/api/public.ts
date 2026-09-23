import type { PodiumLeader } from "../components/leaderboard/Podium";
import type { LeaderboardColumn, LeaderboardRow } from "../components/leaderboard/LeaderboardTable";
import { fetchJson } from "./http";

export type NewsSlideDto = {
  news?: {
    title?: unknown;
    text?: unknown;
    images?: Array<{ path?: unknown }>;
  };
};

export type ContestTvResultDto = {
  contest?: {
    id?: unknown;
    name?: unknown;
    period?: unknown;
    metric?: unknown;
    isPreview?: unknown;
  };
  winners?: Array<{ place?: unknown; employeeId?: unknown; employeeName?: unknown; value?: unknown; reward?: unknown }>;
  ranking?: Array<{ place?: unknown; employeeId?: unknown; employeeName?: unknown; value?: unknown }>;
};

export type ContestTvResultsDto = {
  contests?: ContestTvResultDto[];
  // Актуальный формат API: одиночный конкурс на верхнем уровне
  contest?: ContestTvResultDto["contest"];
  winners?: ContestTvResultDto["winners"];
  ranking?: ContestTvResultDto["ranking"];
};

export type TeamBattleFormulaMetricDto = {
  type?: unknown;
  format?: "percent" | "number" | unknown;
  place_points?: { first?: unknown; second?: unknown; third?: unknown };
};

export type TeamBattleRankingDto = {
  rank?: unknown;
  department?: unknown;
  label?: unknown;
  metrics?: Record<string, unknown>;
  score?: unknown;
  position_change?: unknown;
};

export type TeamBattleLeaderboardDto = {
  success?: unknown;
  data?: {
    contest?: {
      name?: unknown;
      contest_type?: unknown;
      period?: { start?: unknown; end?: unknown };
      prize?: unknown;
    };
    formula_metrics?: TeamBattleFormulaMetricDto[];
    rankings?: TeamBattleRankingDto[];
  };
};

export type LeaderboardSlideDto = {
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

export async function fetchPublicNewsLatest(signal?: AbortSignal): Promise<NewsSlideDto> {
  return fetchJson<NewsSlideDto>("/api/public/news/latest", { signal });
}

export async function fetchContestTvResults(signal?: AbortSignal): Promise<ContestTvResultsDto> {
  return fetchJson<ContestTvResultsDto>("/api/public/contest-tv/results", { signal });
}

export async function fetchTeamBattleLeaderboard(signal?: AbortSignal): Promise<TeamBattleLeaderboardDto> {
  return fetchJson<TeamBattleLeaderboardDto>("/api/public/team-battle-leaderboard", { signal });
}
