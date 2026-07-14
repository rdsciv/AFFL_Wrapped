#!/usr/bin/env python3
"""Build compact, source-backed AFFL season stories from the league archive."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import duckdb


POSITION_NAMES = {
    1: "QB",
    2: "RB",
    3: "WR",
    4: "TE",
    5: "K",
    16: "D/ST",
}


def rounded(value: float | None, digits: int = 2) -> float:
    return round(float(value or 0), digits)


def matchup_card(row: dict, teams: dict[int, dict]) -> dict:
    home_points = rounded(row["home_total_points"])
    away_points = rounded(row["away_total_points"])
    home = teams.get(row["home_team_id"], {"name": "Unknown"})
    away = teams.get(row["away_team_id"], {"name": "Unknown"})
    return {
        "week": row["matchup_period_id"],
        "home": home["name"],
        "away": away["name"],
        "homeScore": home_points,
        "awayScore": away_points,
        "winner": home["name"] if home_points >= away_points else away["name"],
        "margin": rounded(abs(home_points - away_points)),
        "combined": rounded(home_points + away_points),
    }


def season_mood(champ: dict, avg_score: float, title_margin: float, luck: float) -> tuple[str, str]:
    if title_margin <= 5:
        return "The Photo Finish", f"{champ['name']} survived a title game decided by {title_margin:.2f}."
    if luck < -1.5:
        return "Against the Current", f"{champ['name']} won it all despite running below expectation."
    if luck > 1.5:
        return "The Charmed Run", f"{champ['name']} turned every opening into a championship season."
    if avg_score >= 105:
        return "Points in the Air", f"{champ['name']} emerged from one of AFFL's loudest scoring seasons."
    return "The Long Campaign", f"{champ['name']} found the only path that matters: the one to the trophy."


def build_season(con: duckdb.DuckDBPyConnection, season_row: dict) -> dict:
    season = season_row["season"]
    regular_weeks = season_row["regular_matchup_periods"]

    owner_rows = con.execute(
        "SELECT owner_id, display_name FROM owners WHERE season = ?", [season]
    ).fetchall()
    owners = {owner_id: display_name for owner_id, display_name in owner_rows}

    team_rows = con.execute(
        """
        SELECT team_id, name, abbreviation, primary_owner_id, playoff_seed, final_rank,
               wins, losses, ties, points_for, points_against, acquisitions, drops, trades
        FROM teams WHERE season = ? ORDER BY final_rank, team_id
        """,
        [season],
    ).fetchdf().to_dict("records")
    teams: dict[int, dict] = {}
    for team in team_rows:
        team["owner"] = owners.get(team["primary_owner_id"], "AFFL Manager")
        teams[team["team_id"]] = team

    score_rows = con.execute(
        """
        SELECT scoring_period, matchup_period_id, team_id, opponent_team_id, points,
               opponent_points, result, playoff_tier_type
        FROM team_week_scores WHERE season = ? ORDER BY scoring_period, team_id
        """,
        [season],
    ).fetchdf().to_dict("records")
    regular_scores = [r for r in score_rows if r["matchup_period_id"] <= regular_weeks]

    weekly_scores: dict[int, list[dict]] = defaultdict(list)
    for row in regular_scores:
        weekly_scores[row["scoring_period"]].append(row)

    expected_wins = defaultdict(float)
    actual_wins = defaultdict(float)
    for rows in weekly_scores.values():
        for row in rows:
            others = [r["points"] for r in rows if r["team_id"] != row["team_id"]]
            below = sum(row["points"] > value for value in others)
            tied = sum(row["points"] == value for value in others)
            expected_wins[row["team_id"]] += (below + 0.5 * tied) / max(len(others), 1)
            actual_wins[row["team_id"]] += 1 if row["result"] == "W" else 0.5 if row["result"] == "T" else 0

    team_cards = []
    for team in team_rows:
        team_id = team["team_id"]
        expected = expected_wins[team_id]
        actual = actual_wins[team_id]
        team_cards.append(
            {
                "id": team_id,
                "name": team["name"],
                "abbr": team["abbreviation"],
                "owner": team["owner"],
                "rank": team["final_rank"],
                "seed": team["playoff_seed"],
                "record": f"{team['wins']}-{team['losses']}" + (f"-{team['ties']}" if team["ties"] else ""),
                "wins": team["wins"],
                "losses": team["losses"],
                "pointsFor": rounded(team["points_for"]),
                "pointsAgainst": rounded(team["points_against"]),
                "expectedWins": rounded(expected),
                "luck": rounded(actual - expected),
                "acquisitions": int(team["acquisitions"] or 0),
                "trades": int(team["trades"] or 0),
            }
        )
    team_cards.sort(key=lambda x: (x["rank"] or 999, -x["pointsFor"]))

    champion = next((t for t in team_cards if t["rank"] == 1), team_cards[0])
    runner_up = next((t for t in team_cards if t["rank"] == 2), team_cards[1])

    matchup_rows = con.execute(
        """
        SELECT matchup_period_id, playoff_tier_type, home_team_id, away_team_id,
               home_total_points, away_total_points
        FROM matchups WHERE season = ? AND away_team_id IS NOT NULL
        """,
        [season],
    ).fetchdf().to_dict("records")
    title_candidates = [
        row for row in matchup_rows
        if {row["home_team_id"], row["away_team_id"]} == {champion["id"], runner_up["id"]}
    ]
    title_row = max(title_candidates, key=lambda x: x["matchup_period_id"], default=None)
    title_game = matchup_card(title_row, teams) if title_row else {
        "week": season_row["final_scoring_period"],
        "home": champion["name"],
        "away": runner_up["name"],
        "homeScore": 0,
        "awayScore": 0,
        "winner": champion["name"],
        "margin": 0,
        "combined": 0,
    }

    played_matchups = [r for r in matchup_rows if r["home_total_points"] or r["away_total_points"]]
    blowout = max(played_matchups, key=lambda x: abs(x["home_total_points"] - x["away_total_points"]))
    closest = min(played_matchups, key=lambda x: abs(x["home_total_points"] - x["away_total_points"]))
    slugfest = max(played_matchups, key=lambda x: x["home_total_points"] + x["away_total_points"])
    pillow = min(played_matchups, key=lambda x: x["home_total_points"] + x["away_total_points"])

    player_rows = con.execute(
        """
        SELECT player_id, any_value(player_name) AS player_name,
               any_value(default_position_id) AS position_id,
               team_id, SUM(applied_points) AS points,
               MAX(applied_points) AS high_game
        FROM lineups WHERE season = ? AND player_name IS NOT NULL
        GROUP BY player_id, team_id
        """,
        [season],
    ).fetchdf().to_dict("records")
    player_totals = defaultdict(lambda: {"points": 0.0, "high": -999.0, "teams": set(), "name": "", "position": "FLEX"})
    team_player_totals = []
    for row in player_rows:
        player = player_totals[row["player_id"]]
        player["name"] = row["player_name"]
        player["position"] = POSITION_NAMES.get(row["position_id"], "FLEX")
        player["points"] += float(row["points"] or 0)
        player["high"] = max(player["high"], float(row["high_game"] or 0))
        player["teams"].add(row["team_id"])
        team_player_totals.append(row)

    player_leaders = sorted(player_totals.values(), key=lambda x: x["points"], reverse=True)
    season_leaders = [
        {"name": p["name"], "position": p["position"], "points": rounded(p["points"]), "highGame": rounded(p["high"])}
        for p in player_leaders[:8]
    ]

    all_league = []
    for position in ("QB", "RB", "WR", "TE", "K", "D/ST"):
        players = [p for p in player_leaders if p["position"] == position]
        if players:
            all_league.append({"position": position, "name": players[0]["name"], "points": rounded(players[0]["points"])})

    single_game = con.execute(
        """
        SELECT player_name, applied_points, scoring_period, team_id
        FROM lineups WHERE season = ? AND player_name IS NOT NULL
        ORDER BY applied_points DESC LIMIT 1
        """,
        [season],
    ).fetchone()

    carried_candidates = []
    for row in team_player_totals:
        team = teams.get(row["team_id"])
        if team and float(team["points_for"] or 0) > 0:
            carried_candidates.append((float(row["points"] or 0) / float(team["points_for"]), row))
    carried_share, carried = max(carried_candidates, default=(0, {"player_name": "N/A", "team_id": champion["id"], "points": 0}))

    draft_rows = con.execute(
        """
        SELECT overall_pick, round_id, round_pick, team_id, player_id
        FROM draft_picks WHERE season = ? ORDER BY overall_pick
        """,
        [season],
    ).fetchdf().to_dict("records")
    draft_spotlight = []
    for pick in draft_rows:
        player = player_totals.get(pick["player_id"])
        if not player:
            continue
        draft_spotlight.append(
            {
                "player": player["name"],
                "pick": pick["overall_pick"],
                "round": pick["round_id"],
                "team": teams.get(pick["team_id"], {}).get("name", "Unknown"),
                "points": rounded(player["points"]),
            }
        )
    draft_spotlight.sort(key=lambda x: x["points"], reverse=True)
    drafted_ids = {row["player_id"] for row in draft_rows}
    waiver_gems = [
        {"name": p["name"], "position": p["position"], "points": rounded(p["points"])}
        for player_id, p in sorted(player_totals.items(), key=lambda item: item[1]["points"], reverse=True)
        if player_id not in drafted_ids
    ][:5]

    high_week = max(regular_scores, key=lambda x: x["points"])
    low_week = min((r for r in regular_scores if r["points"] > 0), key=lambda x: x["points"])
    all_points = [float(r["points"]) for r in regular_scores]
    avg_score = sum(all_points) / max(len(all_points), 1)
    mood, deck = season_mood(champion, avg_score, title_game["margin"], champion["luck"])

    return {
        "season": season,
        "league": season_row["league_name"],
        "teamCount": season_row["team_count"],
        "regularWeeks": regular_weeks,
        "mood": mood,
        "deck": deck,
        "champion": champion,
        "runnerUp": runner_up,
        "titleGame": title_game,
        "pulse": {
            "averageScore": rounded(avg_score),
            "totalPoints": rounded(sum(all_points), 1),
            "highScore": rounded(high_week["points"]),
            "highScoreTeam": teams[high_week["team_id"]]["name"],
            "highScoreWeek": high_week["scoring_period"],
            "lowScore": rounded(low_week["points"]),
            "lowScoreTeam": teams[low_week["team_id"]]["name"],
            "acquisitions": sum(t["acquisitions"] for t in team_cards),
            "trades": sum(t["trades"] for t in team_cards),
        },
        "powerStandings": sorted(team_cards, key=lambda x: (-x["expectedWins"], -x["pointsFor"])),
        "luckiest": max(team_cards, key=lambda x: x["luck"]),
        "unluckiest": min(team_cards, key=lambda x: x["luck"]),
        "matchupAwards": [
            {"label": "Biggest Blowout", "note": "No mercy was shown.", **matchup_card(blowout, teams)},
            {"label": "Closest Nail-Biter", "note": "Every decimal mattered.", **matchup_card(closest, teams)},
            {"label": "Scoreboard Meltdown", "note": "The season's highest combined score.", **matchup_card(slugfest, teams)},
            {"label": "Pillow Fight", "note": "Someone had to win it.", **matchup_card(pillow, teams)},
        ],
        "playerAwards": {
            "singleGame": {
                "name": single_game[0],
                "points": rounded(single_game[1]),
                "week": single_game[2],
                "team": teams.get(single_game[3], {}).get("name", "Unknown"),
            },
            "carried": {
                "name": carried["player_name"],
                "points": rounded(carried["points"]),
                "share": rounded(carried_share * 100, 1),
                "team": teams.get(carried["team_id"], {}).get("name", "Unknown"),
            },
        },
        "seasonLeaders": season_leaders,
        "allLeague": all_league,
        "draftSpotlight": draft_spotlight[:5],
        "waiverGems": waiver_gems,
        "teams": team_cards,
        "coverage": {
            "draft": bool(draft_rows),
            "transactionEvents": season >= 2018,
            "note": "Detailed ESPN draft and transaction events are available from 2018 onward." if season < 2018 else "ESPN draft and event-level transaction coverage is available for this season.",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("database", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    con = duckdb.connect(str(args.database), read_only=True)
    seasons = con.execute(
        """
        SELECT season, league_name, team_count, regular_matchup_periods,
               final_scoring_period, playoff_team_count
        FROM seasons ORDER BY season DESC
        """
    ).fetchdf().to_dict("records")
    result = {str(row["season"]): build_season(con, row) for row in seasons}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(result)} seasons to {args.output}")


if __name__ == "__main__":
    main()
