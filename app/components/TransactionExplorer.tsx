"use client";

import { startTransition, useDeferredValue, useState } from "react";
import type { AdvancedData, InferredMovement, TransactionItem } from "../lib/advanced";

type Mode = "adds" | "drops" | "movements";

type ExplorerRow = {
  id: string;
  season: number;
  week: number;
  player: string;
  position: string;
  team: string;
  route: string;
  kind: string;
  xFp4w: number | null;
  starterPoints4w: number;
  projectionWeeks: number;
};

function transactionRow(item: TransactionItem): ExplorerRow {
  return {
    id: item.id,
    season: item.season,
    week: item.week,
    player: item.player,
    position: item.position,
    team: item.team,
    route: item.action === "ADD" ? `Free agent → ${item.toTeam}` : `${item.fromTeam} → Free agent`,
    kind: item.kind === "FREEAGENT" ? "Free agent" : "Waiver",
    xFp4w: item.xFp4w,
    starterPoints4w: item.starterPoints4w,
    projectionWeeks: item.projectionWeeks,
  };
}

function movementRow(item: InferredMovement): ExplorerRow {
  return {
    id: item.id,
    season: item.season,
    week: item.week,
    player: item.player,
    position: item.position,
    team: item.toTeam,
    route: `${item.fromTeam} → ${item.toTeam}`,
    kind: `${Math.round(item.confidence * 100)}% confidence`,
    xFp4w: item.xFp4w,
    starterPoints4w: item.starterPoints4w,
    projectionWeeks: item.projectionWeeks,
  };
}

export function TransactionExplorer({ data }: { data: AdvancedData }) {
  const [mode, setMode] = useState<Mode>("adds");
  const [season, setSeason] = useState("2025");
  const [team, setTeam] = useState("all");
  const [position, setPosition] = useState("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const rows = mode === "movements"
    ? data.inferredMovements.map(movementRow)
    : data.transactions.filter((item) => item.action === mode.slice(0, -1).toUpperCase()).map(transactionRow);
  const teams = [...new Set(rows.filter((row) => String(row.season) === season).map((row) => row.team))].sort();
  const positions = [...new Set(rows.map((row) => row.position))].sort();
  const filtered = rows.filter((row) => (
    String(row.season) === season
    && (team === "all" || row.team === team)
    && (position === "all" || row.position === position)
    && (!deferredQuery || `${row.player} ${row.team} ${row.route}`.toLowerCase().includes(deferredQuery))
  ));
  const shown = filtered.slice(0, 120);
  const valued = filtered.filter((row) => row.xFp4w !== null);
  const totalXfp = valued.reduce((sum, row) => sum + (row.xFp4w ?? 0), 0);
  const totalActual = filtered.reduce((sum, row) => sum + row.starterPoints4w, 0);

  function selectMode(next: Mode) {
    startTransition(() => {
      setMode(next);
      setTeam("all");
      setPosition("all");
    });
  }

  return (
    <section className="explorer-shell">
      <div className="explorer-tabs" aria-label="Transaction type">
        <button className={mode === "adds" ? "active" : ""} onClick={() => selectMode("adds")}>Adds</button>
        <button className={mode === "drops" ? "active" : ""} onClick={() => selectMode("drops")}>Drops</button>
        <button className={mode === "movements" ? "active" : ""} onClick={() => selectMode("movements")}>Inferred moves</button>
      </div>

      <div className="explorer-controls">
        <label><span>Season</span><select value={season} onChange={(event) => { setSeason(event.target.value); setTeam("all"); }}>{Object.keys(data.seasons).sort((a, b) => Number(b) - Number(a)).filter((year) => data.seasons[year].eventCoverage).map((year) => <option key={year}>{year}</option>)}</select></label>
        <label><span>Manager</span><select value={team} onChange={(event) => setTeam(event.target.value)}><option value="all">All managers</option>{teams.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label><span>Position</span><select value={position} onChange={(event) => setPosition(event.target.value)}><option value="all">All positions</option>{positions.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="search-control"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Player or team" /></label>
      </div>

      <div className="explorer-kpis">
        <article><span>Matching records</span><strong>{filtered.length.toLocaleString()}</strong></article>
        <article><span>xFP added (4W)</span><strong>{mode === "drops" ? "N/A" : totalXfp.toLocaleString(undefined, { maximumFractionDigits: 1 })}</strong><small>{valued.length} valued records</small></article>
        <article><span>Starter points (4W)</span><strong>{mode === "drops" ? "N/A" : totalActual.toLocaleString(undefined, { maximumFractionDigits: 1 })}</strong><small>Same post-move window</small></article>
        <article><span>Projection coverage</span><strong>{mode === "drops" || !filtered.length ? "N/A" : `${((valued.length / filtered.length) * 100).toFixed(1)}%`}</strong><small>Nulls excluded</small></article>
      </div>

      <div className="transaction-table-wrap">
        <div className="transaction-table-head"><span>Week / type</span><span>Player</span><span>Route</span><span>xFP 4W</span><span>Starter pts</span></div>
        {shown.map((row) => (
          <article className="transaction-entry" key={row.id}>
            <span><strong>W{row.week}</strong><small>{row.kind}</small></span>
            <span><strong>{row.player}</strong><small>{row.position} / {row.team}</small></span>
            <span>{row.route}</span>
            <span><strong>{row.xFp4w === null ? "—" : row.xFp4w.toFixed(1)}</strong><small>{row.projectionWeeks ? `${row.projectionWeeks}/4 weeks` : "No projection"}</small></span>
            <span><strong>{mode === "drops" ? "—" : row.starterPoints4w.toFixed(1)}</strong><small>{mode === "drops" ? "Not modeled" : "actual"}</small></span>
          </article>
        ))}
        {!shown.length && <div className="no-results">No transactions match this view.</div>}
      </div>
      {filtered.length > shown.length && <p className="table-limit">Showing the first {shown.length} of {filtered.length.toLocaleString()} matching records. Refine the filters to narrow the ledger.</p>}
    </section>
  );
}
