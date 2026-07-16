#!/usr/bin/env python3
"""Build the advanced AFFL Wrapped and transaction datasets.

The output intentionally separates official ESPN counters, executed transaction
events, and inferred roster-to-roster movements. Expected fantasy points added
uses a fixed four-week horizon so pickups from different parts of a season can
be compared without rewarding longer roster tenure.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import duckdb


POSITION_NAMES = {
    1: "QB",
    2: "RB",
    3: "WR",
    4: "TE",
    5: "K",
    16: "D/ST",
}

WRAPPED_FILES = (
    "all_league_teams",
    "biggest_games_by_position",
    "biggest_upsets",
    "draft_team_injury",
    "oldest_roster",
    "player_decision_rate",
    "puff_puff_pass",
    "standout_performances",
    "team_all_league_summary",
    "team_week_1_vs_acquired_weekly",
    "team_week_stats",
    "top_free_agent_pickups",
    "transactions",
    "worst_management_weeks",
)


def records(cursor: duckdb.DuckDBPyConnection) -> list[dict[str, Any]]:
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def number(value: Any, digits: int = 2) -> float:
    try:
        return round(float(value or 0), digits)
    except (TypeError, ValueError):
        return 0.0


def integer(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def first(row: dict[str, Any], *keys: str, fallback: str = "Unknown") -> str:
    for key in keys:
        value = row.get(key)
        if value not in (None, ""):
            return str(value)
    return fallback


def compact_weekly(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [
        {
            "week": integer(row.get("week")),
            "core": number(row.get("core_points"), 1),
            "acquired": number(row.get("acquired_points"), 1),
        }
        for row in value
        if isinstance(row, dict)
    ]


def load_wrapped_rows(root: Path, season: int, name: str) -> list[dict[str, Any]]:
    path = root / "api" / "wrapped" / str(season) / f"{name}.json"
    if not path.exists():
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    data = payload.get("data", []) if isinstance(payload, dict) else []
    return data if isinstance(data, list) else []


def build_fantasy_genius(root: Path, season: int) -> dict[str, Any] | None:
    source = {name: load_wrapped_rows(root, season, name) for name in WRAPPED_FILES}
    if not source["team_week_stats"]:
        return None

    return {
        "modules": [
            {
                "id": name,
                "rows": len(rows),
                "source": "ESPN archive" if name == "transactions" else "Fantasy Genius",
                "status": "replaced" if name == "transactions" else "available",
            }
            for name, rows in source.items()
        ],
        "allLeague": [
            {
                "team": row.get("team_number"),
                "position": first(row, "position"),
                "player": first(row, "player_name"),
                "points": number(row.get("total_points_all_games"), 1),
                "starts": integer(row.get("total_starts")),
                "drafted": bool(row.get("was_drafted")),
                "draftTeam": first(row, "drafting_team_display_name", fallback="Undrafted"),
                "pick": integer(row.get("overall_draft_pick_number")),
            }
            for row in source["all_league_teams"]
        ],
        "biggestGames": [
            {
                "rank": integer(row.get("game_rank")),
                "position": first(row, "position"),
                "player": first(row, "player_name"),
                "team": first(row, "team_display_name"),
                "week": integer(row.get("week")),
                "points": number(row.get("points"), 1),
                "carryPct": number(row.get("team_on_the_back_pct"), 1),
                "loss": bool(row.get("is_biggest_game_in_loss")),
            }
            for row in source["biggest_games_by_position"]
        ],
        "upsets": [
            {
                "rank": integer(row.get("upset_rank")),
                "week": integer(row.get("week")),
                "winner": first(row, "winner_display_name"),
                "loser": first(row, "loser_display_name"),
                "winnerPoints": number(row.get("winner_points"), 1),
                "loserPoints": number(row.get("loser_points"), 1),
                "magnitude": number(row.get("upset_magnitude"), 1),
                "playoff": bool(row.get("was_playoff_upset")),
            }
            for row in source["biggest_upsets"]
        ],
        "injuries": [
            {
                "rank": integer(row.get("injury_impact_rank_in_league")),
                "team": first(row, "fantasy_team_name", "team_display_name"),
                "weeksMissed": integer(row.get("total_weeks_missed_by_players")),
                "lostPoints": number(row.get("total_weighted_lost_points"), 1),
                "opportunityCost": number(row.get("total_weighted_opportunity_cost"), 1),
                "resilience": number(row.get("injury_resilience_score"), 1),
            }
            for row in source["draft_team_injury"]
        ],
        "rosterAge": [
            {
                "rank": integer(row.get("rank_oldest_roster")),
                "team": first(row, "team_display_name"),
                "age": number(row.get("weighted_avg_age"), 1),
                "youngest": integer(row.get("youngest_starter_age")),
                "oldest": integer(row.get("oldest_starter_age")),
                "under25": integer(row.get("starters_under_25")),
                "over30": integer(row.get("starters_30_plus")),
            }
            for row in source["oldest_roster"]
        ],
        "decisions": [
            {
                "rank": integer(row.get("rank_most_incorrect_decisions")),
                "player": first(row, "player_name"),
                "position": first(row, "position"),
                "team": first(row, "team_display_name"),
                "accuracy": number(number(row.get("decision_accuracy_rate"), 3) * 100, 1),
                "incorrect": integer(row.get("incorrect_decisions")),
                "wrongStart": integer(row.get("started_incorrectly")),
                "wrongBench": integer(row.get("benched_incorrectly")),
            }
            for row in source["player_decision_rate"]
        ],
        "grenades": [
            {
                "rank": integer(row.get("grenade_rank")),
                "player": first(row, "player_name"),
                "position": first(row, "position"),
                "teams": integer(row.get("teams_rostered_on")),
                "weeks": integer(row.get("total_weeks_rostered")),
                "starts": integer(row.get("total_starts")),
                "points": number(row.get("total_points_across_all_teams"), 1),
            }
            for row in source["puff_puff_pass"]
        ],
        "standouts": [
            {
                "type": first(row, "achievement_type"),
                "player": first(row, "player_name"),
                "team": first(row, "team_display_name"),
                "position": first(row, "position"),
                "week": integer(row.get("week")),
                "points": number(row.get("points"), 1),
                "carryPct": number(row.get("team_on_the_back_pct"), 1),
            }
            for row in source["standout_performances"]
        ],
        "teamHonors": [
            {
                "team": first(row, "team_display_name"),
                "allLeague": integer(row.get("total_all_league_selections")),
                "bushLeague": integer(row.get("total_bush_league_selections")),
                "net": integer(row.get("net_selections")),
            }
            for row in source["team_all_league_summary"]
        ],
        "coreVsAcquired": [
            {
                "team": first(row, "team_display_name"),
                "corePoints": number(row.get("season_core_points"), 1),
                "acquiredPoints": number(row.get("season_acquired_points"), 1),
                "acquiredPct": number(row.get("season_pct_acquired"), 1),
                "weekly": compact_weekly(row.get("weekly_breakdown_json")),
            }
            for row in source["team_week_1_vs_acquired_weekly"]
        ],
        "teamStats": [
            {
                "team": first(row, "team_display_name", "team_name", "display_name"),
                "wins": integer(row.get("total_wins")),
                "losses": integer(row.get("total_losses")),
                "ppg": number(row.get("avg_points_per_game"), 1),
                "consistency": number(row.get("scoring_consistency_stddev"), 1),
                "high": number(row.get("highest_scoring_week"), 1),
                "low": number(row.get("lowest_scoring_week"), 1),
                "management": number(row.get("avg_management_score_pct"), 1),
                "left": number(row.get("total_points_left_on_table"), 1),
                "luckyWins": integer(row.get("lucky_wins")),
                "unluckyLosses": integer(row.get("unlucky_losses")),
            }
            for row in source["team_week_stats"]
        ],
        "pickups": [
            {
                "rank": integer(row.get("free_agent_rank_position")),
                "position": first(row, "position"),
                "player": first(row, "player_name"),
                "team": first(row, "pickup_team_display_name"),
                "week": integer(row.get("pickup_week")),
                "startedPoints": number(row.get("total_points_when_started"), 1),
                "starts": integer(row.get("total_starts")),
                "ppg": number(row.get("ppg_starts_only"), 1),
            }
            for row in source["top_free_agent_pickups"]
        ],
        "managementWeeks": [
            {
                "team": first(row, "team_display_name", "team_name", "display_name"),
                "week": integer(row.get("week")),
                "actual": number(row.get("actual_points"), 1),
                "ideal": number(row.get("ideal_points"), 1),
                "left": number(row.get("points_left_on_table"), 1),
                "score": number(row.get("management_score_pct"), 1),
                "result": first(row, "matchup_result"),
            }
            for row in source["worst_management_weeks"]
        ],
    }


def projection_from_snapshot(raw_json: Any, week: int) -> float | None:
    try:
        payload = json.loads(raw_json) if isinstance(raw_json, str) else raw_json
        stats = payload["playerPoolEntry"]["player"].get("stats", [])
    except (TypeError, KeyError, json.JSONDecodeError):
        return None
    for stat in stats:
        if (
            stat.get("statSourceId") == 1
            and stat.get("statSplitTypeId") == 1
            and stat.get("scoringPeriodId") == week
            and stat.get("appliedTotal") is not None
        ):
            return number(stat["appliedTotal"], 2)
    return None


def four_week_value(
    season: int,
    week: int,
    team_id: int,
    player_id: int,
    snapshots: dict[tuple[int, int, int, int], dict[str, Any]],
    actuals: dict[tuple[int, int, int, int], dict[str, Any]],
) -> dict[str, Any]:
    projected = 0.0
    projection_weeks = 0
    roster_points = 0.0
    starter_points = 0.0
    rostered_weeks = 0
    seen_roster = False

    for scoring_period in range(week, week + 4):
        snapshot = snapshots.get((season, scoring_period, team_id, player_id))
        if snapshot is None:
            if seen_roster:
                break
            continue
        seen_roster = True
        rostered_weeks += 1
        if snapshot["projection"] is not None:
            projected += snapshot["projection"]
            projection_weeks += 1

        actual = actuals.get((season, scoring_period, team_id, player_id))
        if actual:
            roster_points += actual["points"]
            if actual["starter"]:
                starter_points += actual["points"]

    return {
        "xFp4w": number(projected, 1) if projection_weeks else None,
        "projectionWeeks": projection_weeks,
        "rosteredWeeks": rostered_weeks,
        "starterPoints4w": number(starter_points, 1),
        "rosterPoints4w": number(roster_points, 1),
    }


def iso_date(value: Any) -> str | None:
    if not value:
        return None
    return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc).date().isoformat()


def build_data(con: duckdb.DuckDBPyConnection, wrapped_root: Path) -> dict[str, Any]:
    team_rows = records(con.execute(
        """
        SELECT season, team_id, name, abbreviation, acquisitions, drops, trades
        FROM teams ORDER BY season, team_id
        """
    ))
    teams = {(row["season"], row["team_id"]): row for row in team_rows}

    transaction_rows = records(con.execute(
        """
        SELECT t.season, t.transaction_id, t.scoring_period, t.transaction_type,
               t.status, t.process_date_ms, t.bid_amount, t.team_id,
               i.item_index, i.item_type, i.player_id, i.from_team_id, i.to_team_id
        FROM transactions t
        JOIN transaction_items i USING (season, transaction_id)
        WHERE t.status = 'EXECUTED'
        ORDER BY t.season, t.process_date_ms, i.item_index
        """
    ))
    movement_rows = records(con.execute(
        """
        SELECT season, scoring_period, player_id, player_name, from_team_id,
               to_team_id, classification, confidence
        FROM roster_movements
        WHERE classification = 'inferred_trade_candidate'
        ORDER BY season, scoring_period, player_id
        """
    ))

    relevant_players: set[tuple[int, int]] = {
        (row["season"], row["player_id"])
        for row in transaction_rows
        if row["player_id"] is not None
    }
    relevant_players.update(
        (row["season"], row["player_id"]) for row in movement_rows
    )

    snapshots: dict[tuple[int, int, int, int], dict[str, Any]] = {}
    player_names: dict[tuple[int, int], str] = {}
    player_positions: dict[tuple[int, int], str] = {}
    snapshot_cursor = con.execute(
        """
        SELECT season, scoring_period, team_id, player_id, player_name,
               default_position_id, raw_json
        FROM roster_snapshots WHERE season >= 2018
        """
    )
    while True:
        batch = snapshot_cursor.fetchmany(500)
        if not batch:
            break
        for season, week, team_id, player_id, player_name, position_id, raw_json in batch:
            if (season, player_id) not in relevant_players:
                continue
            player_names[(season, player_id)] = player_name or "Unknown player"
            player_positions[(season, player_id)] = POSITION_NAMES.get(position_id, "FLEX")
            snapshots[(season, week, team_id, player_id)] = {
                "projection": projection_from_snapshot(raw_json, week),
            }

    actuals: dict[tuple[int, int, int, int], dict[str, Any]] = {}
    for row in records(con.execute(
        """
        SELECT season, scoring_period, team_id, player_id,
               any_value(player_name) AS player_name,
               any_value(default_position_id) AS position_id,
               SUM(COALESCE(applied_points, 0)) AS points,
               BOOL_OR(lineup_slot_id NOT IN (20, 21)) AS starter
        FROM lineups WHERE season >= 2018
        GROUP BY season, scoring_period, team_id, player_id
        """
    )):
        key = (row["season"], row["player_id"])
        if key not in relevant_players:
            continue
        player_names.setdefault(key, row["player_name"] or "Unknown player")
        player_positions.setdefault(key, POSITION_NAMES.get(row["position_id"], "FLEX"))
        actuals[(row["season"], row["scoring_period"], row["team_id"], row["player_id"])] = {
            "points": number(row["points"], 2),
            "starter": bool(row["starter"]),
        }

    global_players: dict[int, tuple[str, str]] = {}
    for player_id, player_name, position_id in con.execute(
        """
        SELECT player_id, any_value(player_name), any_value(default_position_id)
        FROM (
          SELECT player_id, player_name, default_position_id FROM roster_snapshots
          UNION ALL
          SELECT player_id, player_name, default_position_id FROM lineups
        ) players
        WHERE player_name IS NOT NULL
        GROUP BY player_id
        """
    ).fetchall():
        global_players[player_id] = (player_name, POSITION_NAMES.get(position_id, "FLEX"))

    transaction_items: list[dict[str, Any]] = []
    for row in transaction_rows:
        action = row["item_type"] or "MOVE"
        team_id = row["to_team_id"] if action == "ADD" else row["from_team_id"]
        team = teams.get((row["season"], team_id), {})
        value = (
            four_week_value(
                row["season"], row["scoring_period"], team_id, row["player_id"], snapshots, actuals
            )
            if action == "ADD" and team_id and row["player_id"] is not None
            else {
                "xFp4w": None,
                "projectionWeeks": 0,
                "rosteredWeeks": 0,
                "starterPoints4w": 0.0,
                "rosterPoints4w": 0.0,
            }
        )
        global_name, global_position = global_players.get(row["player_id"], ("Unknown player", "FLEX"))
        transaction_items.append({
            "id": f"{row['season']}-{row['transaction_id']}-{row['item_index']}",
            "season": row["season"],
            "week": row["scoring_period"],
            "date": iso_date(row["process_date_ms"]),
            "kind": row["transaction_type"],
            "action": action,
            "playerId": row["player_id"],
            "player": player_names.get((row["season"], row["player_id"]), global_name),
            "position": player_positions.get((row["season"], row["player_id"]), global_position),
            "teamId": team_id,
            "team": team.get("name", "Unknown team"),
            "fromTeam": teams.get((row["season"], row["from_team_id"]), {}).get("name"),
            "toTeam": teams.get((row["season"], row["to_team_id"]), {}).get("name"),
            "bid": number(row["bid_amount"], 0),
            **value,
        })

    inferred_movements: list[dict[str, Any]] = []
    for index, row in enumerate(movement_rows):
        value = four_week_value(
            row["season"], row["scoring_period"], row["to_team_id"], row["player_id"], snapshots, actuals
        )
        inferred_movements.append({
            "id": f"movement-{row['season']}-{row['scoring_period']}-{row['player_id']}-{index}",
            "season": row["season"],
            "week": row["scoring_period"],
            "playerId": row["player_id"],
            "player": row["player_name"] or player_names.get((row["season"], row["player_id"]), "Unknown player"),
            "position": player_positions.get((row["season"], row["player_id"]), "FLEX"),
            "fromTeamId": row["from_team_id"],
            "fromTeam": teams.get((row["season"], row["from_team_id"]), {}).get("name", "Unknown team"),
            "toTeamId": row["to_team_id"],
            "toTeam": teams.get((row["season"], row["to_team_id"]), {}).get("name", "Unknown team"),
            "confidence": number(row["confidence"], 2),
            **value,
        })

    status_rows = records(con.execute(
        """
        SELECT season, transaction_type, status, COUNT(*) AS count
        FROM transactions GROUP BY season, transaction_type, status
        ORDER BY season, transaction_type, status
        """
    ))
    statuses: dict[int, Counter[str]] = defaultdict(Counter)
    for row in status_rows:
        status = row["status"] or "UNKNOWN"
        statuses[row["season"]][status] += row["count"]
        statuses[row["season"]][f"{row['transaction_type']}:{status}"] += row["count"]

    failed_by_team: dict[tuple[int, int], int] = defaultdict(int)
    for season, team_id, count in con.execute(
        """
        SELECT season, team_id, COUNT(*)
        FROM transactions WHERE status LIKE 'FAILED%'
        GROUP BY season, team_id
        """
    ).fetchall():
        failed_by_team[(season, team_id)] = count

    event_rollup: dict[tuple[int, int], Counter[str]] = defaultdict(Counter)
    xfp_rollup: dict[tuple[int, int], list[float]] = defaultdict(list)
    for item in transaction_items:
        key = (item["season"], item["teamId"])
        event_rollup[key][item["action"]] += 1
        event_rollup[key][item["kind"]] += 1
        if item["action"] == "ADD" and item["xFp4w"] is not None:
            xfp_rollup[key].append(item["xFp4w"])

    movement_counts: Counter[int] = Counter(row["season"] for row in inferred_movements)
    transaction_seasons = {row["season"] for row in transaction_rows}
    annuals: dict[str, Any] = {}
    for season in sorted({row["season"] for row in team_rows}):
        season_teams = []
        for row in (team for team in team_rows if team["season"] == season):
            key = (season, row["team_id"])
            values = xfp_rollup[key]
            season_teams.append({
                "teamId": row["team_id"],
                "team": row["name"],
                "abbr": row["abbreviation"],
                "officialAdds": integer(row["acquisitions"]),
                "officialDrops": integer(row["drops"]),
                "officialTrades": integer(row["trades"]),
                "executedAdds": event_rollup[key]["ADD"],
                "executedDrops": event_rollup[key]["DROP"],
                "freeAgents": event_rollup[key]["FREEAGENT"],
                "waivers": event_rollup[key]["WAIVER"],
                "failedClaims": failed_by_team[key],
                "xFpAdded4w": number(sum(values), 1) if values else None,
                "avgXFpPerAdd": number(sum(values) / len(values), 1) if values else None,
                "valuedAdds": len(values),
            })

        season_items = [row for row in transaction_items if row["season"] == season]
        season_adds = [row for row in season_items if row["action"] == "ADD"]
        valued_adds = [row for row in season_adds if row["xFp4w"] is not None]
        annuals[str(season)] = {
            "season": season,
            "eventCoverage": season in transaction_seasons,
            "wrappedCoverage": 2020 <= season <= 2025,
            "official": {
                "adds": sum(integer(row["acquisitions"]) for row in team_rows if row["season"] == season),
                "drops": sum(integer(row["drops"]) for row in team_rows if row["season"] == season),
                "trades": sum(integer(row["trades"]) for row in team_rows if row["season"] == season),
            },
            "events": {
                "executedAdds": len(season_adds),
                "executedDrops": sum(row["action"] == "DROP" for row in season_items),
                "failedClaims": sum(count for status, count in statuses[season].items() if status.startswith("FAILED")),
                "canceledClaims": statuses[season]["CANCELED"],
                "inferredPlayerMovements": movement_counts[season],
                "valuedAdds": len(valued_adds),
                "projectionCoveragePct": number(100 * len(valued_adds) / len(season_adds), 1) if season_adds else 0,
                "xFpAdded4w": number(sum(row["xFp4w"] for row in valued_adds), 1),
                "starterPoints4w": number(sum(row["starterPoints4w"] for row in season_adds), 1),
            },
            "teams": sorted(season_teams, key=lambda row: (-row["officialAdds"], row["team"])),
            "wrapped": build_fantasy_genius(wrapped_root, season),
        }

    return {
        "league": {"name": "AFFL", "id": 51418, "seasons": [2014, 2025]},
        "metric": {
            "name": "Expected fantasy points added",
            "shortName": "xFP added (4W)",
            "definition": "Sum of ESPN weekly point projections during the first four scoring periods after an executed add, while the player remains on the destination roster.",
            "actualDefinition": "Starter points over the same four-period window; bench and injured-reserve slots are excluded.",
            "missingness": "Missing projections remain null and are reported in coverage rather than treated as zero.",
        },
        "coverage": {
            "officialTeamCounters": [2014, 2025],
            "executedTransactions": [2018, 2025],
            "fantasyGeniusWrapped": [2020, 2025],
            "inferredMovements": [2018, 2025],
        },
        "seasons": annuals,
        "transactions": sorted(
            transaction_items,
            key=lambda row: (row["season"], row["week"], row["date"] or "", row["id"]),
            reverse=True,
        ),
        "inferredMovements": sorted(
            inferred_movements,
            key=lambda row: (row["season"], row["week"], row["id"]),
            reverse=True,
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("database", type=Path)
    parser.add_argument("wrapped_root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    con = duckdb.connect(str(args.database), read_only=True)
    output = build_data(con, args.wrapped_root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, separators=(",", ":")), encoding="utf-8")
    print(
        f"Wrote {len(output['seasons'])} seasons, {len(output['transactions'])} executed items, "
        f"and {len(output['inferredMovements'])} inferred movements to {args.output}"
    )


if __name__ == "__main__":
    main()
