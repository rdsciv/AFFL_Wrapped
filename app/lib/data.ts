import wrappedData from "../data/wrapped.json";

export type TeamCard = {
  id: number;
  name: string;
  abbr: string;
  owner: string;
  rank: number;
  seed: number;
  record: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  expectedWins: number;
  luck: number;
  acquisitions: number;
  trades: number;
};

export type MatchupAward = {
  label: string;
  note: string;
  week: number;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  winner: string;
  margin: number;
  combined: number;
};

export type SeasonStory = {
  season: number;
  league: string;
  teamCount: number;
  regularWeeks: number;
  mood: string;
  deck: string;
  champion: TeamCard;
  runnerUp: TeamCard;
  titleGame: Omit<MatchupAward, "label" | "note">;
  pulse: {
    averageScore: number;
    totalPoints: number;
    highScore: number;
    highScoreTeam: string;
    highScoreWeek: number;
    lowScore: number;
    lowScoreTeam: string;
    acquisitions: number;
    trades: number;
  };
  powerStandings: TeamCard[];
  luckiest: TeamCard;
  unluckiest: TeamCard;
  matchupAwards: MatchupAward[];
  playerAwards: {
    singleGame: { name: string; points: number; week: number; team: string };
    carried: { name: string; points: number; share: number; team: string };
  };
  seasonLeaders: { name: string; position: string; points: number; highGame: number }[];
  allLeague: { position: string; name: string; points: number }[];
  draftSpotlight: { player: string; pick: number; round: number; team: string; points: number }[];
  waiverGems: { name: string; position: string; points: number }[];
  teams: TeamCard[];
  coverage: { draft: boolean; transactionEvents: boolean; note: string };
};

export const stories = wrappedData as Record<string, SeasonStory>;
export const seasons = Object.keys(stories).map(Number).sort((a, b) => b - a);

export function getStory(season: string | number) {
  return stories[String(season)];
}

export function formatPoints(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: value >= 1000 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}
