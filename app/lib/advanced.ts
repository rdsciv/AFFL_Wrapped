import advancedData from "../data/advanced.json";

export type TeamTransaction = {
  teamId: number;
  team: string;
  abbr: string;
  officialAdds: number;
  officialDrops: number;
  officialTrades: number;
  executedAdds: number;
  executedDrops: number;
  freeAgents: number;
  waivers: number;
  failedClaims: number;
  xFpAdded4w: number | null;
  avgXFpPerAdd: number | null;
  valuedAdds: number;
};

export type TransactionItem = {
  id: string;
  season: number;
  week: number;
  date: string | null;
  kind: string;
  action: string;
  playerId: number;
  player: string;
  position: string;
  teamId: number;
  team: string;
  fromTeam: string | null;
  toTeam: string | null;
  bid: number;
  xFp4w: number | null;
  projectionWeeks: number;
  rosteredWeeks: number;
  starterPoints4w: number;
  rosterPoints4w: number;
};

export type InferredMovement = {
  id: string;
  season: number;
  week: number;
  playerId: number;
  player: string;
  position: string;
  fromTeamId: number;
  fromTeam: string;
  toTeamId: number;
  toTeam: string;
  confidence: number;
  xFp4w: number | null;
  projectionWeeks: number;
  rosteredWeeks: number;
  starterPoints4w: number;
  rosterPoints4w: number;
};

type WrappedModule = { id: string; rows: number; source: string; status: string };
type WrappedSeason = {
  modules: WrappedModule[];
  allLeague: { team: number; position: string; player: string; points: number; starts: number; drafted: boolean; draftTeam: string; pick: number }[];
  biggestGames: { rank: number; position: string; player: string; team: string; week: number; points: number; carryPct: number; loss: boolean }[];
  upsets: { rank: number; week: number; winner: string; loser: string; winnerPoints: number; loserPoints: number; magnitude: number; playoff: boolean }[];
  injuries: { rank: number; team: string; weeksMissed: number; lostPoints: number; opportunityCost: number; resilience: number }[];
  rosterAge: { rank: number; team: string; age: number; youngest: number; oldest: number; under25: number; over30: number }[];
  decisions: { rank: number; player: string; position: string; team: string; accuracy: number; incorrect: number; wrongStart: number; wrongBench: number }[];
  grenades: { rank: number; player: string; position: string; teams: number; weeks: number; starts: number; points: number }[];
  standouts: { type: string; player: string; team: string; position: string; week: number; points: number; carryPct: number }[];
  teamHonors: { team: string; allLeague: number; bushLeague: number; net: number }[];
  coreVsAcquired: { team: string; corePoints: number; acquiredPoints: number; acquiredPct: number; weekly: { week: number; core: number; acquired: number }[] }[];
  teamStats: { team: string; wins: number; losses: number; ppg: number; consistency: number; high: number; low: number; management: number; left: number; luckyWins: number; unluckyLosses: number }[];
  pickups: { rank: number; position: string; player: string; team: string; week: number; startedPoints: number; starts: number; ppg: number }[];
  managementWeeks: { team: string; week: number; actual: number; ideal: number; left: number; score: number; result: string }[];
};

export type AdvancedSeason = {
  season: number;
  eventCoverage: boolean;
  wrappedCoverage: boolean;
  official: { adds: number; drops: number; trades: number };
  events: {
    executedAdds: number;
    executedDrops: number;
    failedClaims: number;
    canceledClaims: number;
    inferredPlayerMovements: number;
    valuedAdds: number;
    projectionCoveragePct: number;
    xFpAdded4w: number;
    starterPoints4w: number;
  };
  teams: TeamTransaction[];
  wrapped: WrappedSeason | null;
};

export type AdvancedData = {
  league: { name: string; id: number; seasons: number[] };
  metric: { name: string; shortName: string; definition: string; actualDefinition: string; missingness: string };
  coverage: Record<string, number[]>;
  seasons: Record<string, AdvancedSeason>;
  transactions: TransactionItem[];
  inferredMovements: InferredMovement[];
};

export const advanced = advancedData as AdvancedData;

export function getAdvancedSeason(season: string | number) {
  return advanced.seasons[String(season)];
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}
