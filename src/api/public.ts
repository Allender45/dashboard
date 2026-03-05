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

export type ContestTvResultsDto = {
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
