import Link from "next/link";
import { compactNumber, getAdvancedSeason, type AdvancedSeason } from "../lib/advanced";
import { ArrowIcon } from "./Mark";

function SectionIntro({ index, kicker, title, copy }: { index: string; kicker: string; title: string; copy: string }) {
  return (
    <div className="section-intro reveal">
      <div className="section-index">{index}</div>
      <div>
        <span className="eyebrow">{kicker}</span>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
    </div>
  );
}

function ChartHeader({ title, note }: { title: string; note: string }) {
  return <div className="chart-header"><strong>{title}</strong><span>{note}</span></div>;
}

function FrontOffice({ season }: { season: AdvancedSeason }) {
  const maxMoves = Math.max(...season.teams.map((team) => team.officialAdds + team.officialDrops + team.officialTrades), 1);
  const xfpTeams = [...season.teams]
    .filter((team) => team.xFpAdded4w !== null)
    .sort((a, b) => (b.xFpAdded4w ?? 0) - (a.xFpAdded4w ?? 0));
  const maxXfp = Math.max(...xfpTeams.map((team) => team.xFpAdded4w ?? 0), 1);

  return (
    <section className="front-office-section section-pad" id="transactions">
      <SectionIntro index="07" kicker="Front-office tape" title="Moves with receipts" copy="Adds, drops, official trade counts, failed claims, and a standardized four-week estimate of the points each pickup brought through the door." />
      <div className="transaction-kpis reveal">
        <article className="txn-kpi red"><span>Official adds</span><strong>{season.official.adds}</strong><small>ESPN team counters</small></article>
        <article className="txn-kpi cream"><span>Official drops</span><strong>{season.official.drops}</strong><small>ESPN team counters</small></article>
        <article className="txn-kpi yellow"><span>Official trades</span><strong>{season.official.trades}</strong><small>Team-reported activity</small></article>
        <article className="txn-kpi blue"><span>xFP added</span><strong>{season.eventCoverage ? compactNumber(season.events.xFpAdded4w) : "N/A"}</strong><small>{season.eventCoverage ? "Four-week ESPN projections" : "Event feed begins in 2018"}</small></article>
        <article className="txn-kpi ink"><span>Failed claims</span><strong>{season.eventCoverage ? season.events.failedClaims : "N/A"}</strong><small>{season.eventCoverage ? "Rejected waiver attempts" : "Not in historical event feed"}</small></article>
      </div>

      <div className="front-office-grid">
        <article className="chart-card reveal">
          <ChartHeader title="Manager move volume" note="Official adds + drops + trades" />
          <div className="bar-ledger transaction-bars">
            {season.teams.map((team) => {
              const adds = (team.officialAdds / maxMoves) * 100;
              const drops = (team.officialDrops / maxMoves) * 100;
              const trades = (team.officialTrades / maxMoves) * 100;
              return (
                <div className="bar-row" key={team.teamId}>
                  <span>{team.team}</span>
                  <div className="stack-track" aria-label={`${team.officialAdds} adds, ${team.officialDrops} drops, ${team.officialTrades} trades`}>
                    <i className="stack-add" style={{ width: `${adds}%` }} />
                    <i className="stack-drop" style={{ width: `${drops}%` }} />
                    <i className="stack-trade" style={{ width: `${trades}%` }} />
                  </div>
                  <strong>{team.officialAdds + team.officialDrops + team.officialTrades}</strong>
                </div>
              );
            })}
          </div>
          <div className="chart-legend"><span className="legend-add">Adds</span><span className="legend-drop">Drops</span><span className="legend-trade">Trades</span></div>
        </article>

        <article className="chart-card dark reveal">
          <ChartHeader title="Expected value created" note="xFP added over four rostered weeks" />
          {xfpTeams.length ? (
            <div className="bar-ledger xfp-bars">
              {xfpTeams.map((team) => (
                <div className="bar-row" key={team.teamId}>
                  <span>{team.team}</span>
                  <div className="single-track"><i style={{ width: `${((team.xFpAdded4w ?? 0) / maxXfp) * 100}%` }} /></div>
                  <strong>{compactNumber(team.xFpAdded4w ?? 0)}</strong>
                </div>
              ))}
            </div>
          ) : <p className="empty-chart">Executed transaction items and weekly projections are available from 2018 onward. Official season counters remain complete here.</p>}
          {season.eventCoverage && <p className="chart-footnote">Projection coverage: {season.events.projectionCoveragePct}% of executed adds. Missing projections are excluded, never treated as zero.</p>}
        </article>
      </div>

      <div className="method-strip reveal">
        <div><span>Metric</span><strong>xFP added (4W)</strong></div>
        <p>ESPN weekly projections are summed for the first four scoring periods after an executed add, stopping when the player leaves that roster. Actual starter points use the same window.</p>
        <Link href={`/transactions?season=${season.season}`}>Open every move <ArrowIcon /></Link>
      </div>
    </section>
  );
}

function DecisionRoom({ season }: { season: AdvancedSeason }) {
  const wrapped = season.wrapped;
  if (!wrapped) return null;
  const managers = [...wrapped.teamStats].sort((a, b) => b.management - a.management);
  const maxLeft = Math.max(...managers.map((team) => team.left), 1);

  return (
    <section className="decision-section section-pad" id="decisions">
      <SectionIntro index="08" kicker="Start / sit autopsy" title="The decision room" copy="Management accuracy, points stranded on the bench, and the players who made every lineup call feel like a trap." />
      <div className="decision-grid">
        <article className="chart-card reveal">
          <ChartHeader title="Management accuracy" note="Ideal-lineup points captured" />
          <div className="dual-ledger">
            {managers.map((team) => (
              <div className="dual-row" key={team.team}>
                <span>{team.team}</span>
                <div><i style={{ width: `${team.management}%` }} /></div>
                <strong>{team.management.toFixed(1)}%</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="chart-card blue-card reveal">
          <ChartHeader title="Points left on the table" note="Season total by manager" />
          <div className="bar-ledger light-bars">
            {[...managers].sort((a, b) => b.left - a.left).map((team) => (
              <div className="bar-row" key={team.team}>
                <span>{team.team}</span>
                <div className="single-track"><i style={{ width: `${(team.left / maxLeft) * 100}%` }} /></div>
                <strong>{compactNumber(team.left)}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mistake-board">
        <article className="decision-list reveal">
          <ChartHeader title="Hardest players to manage" note="Most incorrect weekly calls" />
          {wrapped.decisions.slice(0, 6).map((player, index) => (
            <div className="decision-row" key={`${player.player}-${index}`}>
              <em>{String(index + 1).padStart(2, "0")}</em>
              <span><strong>{player.player}</strong><small>{player.team} / {player.position}</small></span>
              <span><strong>{player.incorrect}</strong><small>wrong calls</small></span>
              <span><strong>{player.accuracy.toFixed(1)}%</strong><small>accuracy</small></span>
            </div>
          ))}
        </article>
        <article className="worst-week reveal">
          <span className="eyebrow">Worst management week</span>
          <strong className="worst-number">{compactNumber(wrapped.managementWeeks[0]?.left ?? 0)}</strong>
          <h3>{wrapped.managementWeeks[0]?.team}</h3>
          <p>points left behind in Week {wrapped.managementWeeks[0]?.week}. Actual {wrapped.managementWeeks[0]?.actual.toFixed(1)} / ideal {wrapped.managementWeeks[0]?.ideal.toFixed(1)}.</p>
        </article>
      </div>
    </section>
  );
}

function TalentOrigin({ season }: { season: AdvancedSeason }) {
  const wrapped = season.wrapped;
  if (!wrapped) return null;
  const teams = [...wrapped.coreVsAcquired].sort((a, b) => b.acquiredPct - a.acquiredPct);
  return (
    <section className="origin-section section-pad" id="roster-origin">
      <SectionIntro index="09" kicker="Draft room versus open market" title="Where the points came from" copy="A season-long split between the Week 1 core and players acquired after opening day." />
      <div className="origin-chart reveal">
        <ChartHeader title="Scoring mix by team" note="Share of starter points / full season" />
        {teams.map((team) => (
          <div className="origin-row" key={team.team}>
            <span>{team.team}</span>
            <div className="origin-stack">
              <i className="origin-core" style={{ width: `${100 - team.acquiredPct}%` }}><b>{(100 - team.acquiredPct).toFixed(0)}%</b></i>
              <i className="origin-acquired" style={{ width: `${team.acquiredPct}%` }}>{team.acquiredPct >= 12 && <b>{team.acquiredPct.toFixed(0)}%</b>}</i>
            </div>
            <strong>{compactNumber(team.acquiredPoints)} acquired pts</strong>
          </div>
        ))}
        <div className="chart-legend"><span className="legend-core">Week 1 core</span><span className="legend-acquired">Acquired</span></div>
      </div>
    </section>
  );
}

function RosterBurden({ season }: { season: AdvancedSeason }) {
  const wrapped = season.wrapped;
  if (!wrapped) return null;
  const injuries = [...wrapped.injuries].sort((a, b) => b.lostPoints - a.lostPoints);
  const ages = [...wrapped.rosterAge].sort((a, b) => b.age - a.age);
  const maxInjury = Math.max(...injuries.map((team) => team.lostPoints), 1);

  return (
    <section className="burden-section section-pad" id="roster-health">
      <SectionIntro index="10" kicker="Bodies and mileage" title="Roster burden" copy="Draft capital lost to injury and the weighted age of every starting lineup, side by side." />
      <div className="burden-grid">
        <article className="chart-card reveal">
          <ChartHeader title="Weighted points lost to injury" note="Drafted players / opportunity adjusted" />
          <div className="bar-ledger injury-bars">
            {injuries.map((team) => (
              <div className="bar-row" key={team.team}>
                <span>{team.team}</span>
                <div className="single-track"><i style={{ width: `${(team.lostPoints / maxInjury) * 100}%` }} /></div>
                <strong>{compactNumber(team.lostPoints)}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="chart-card age-card reveal">
          <ChartHeader title="Starting lineup age" note="Weighted average / 22-30 year scale" />
          <div className="age-plot">
            {ages.map((team) => (
              <div className="age-row" key={team.team}>
                <span>{team.team}</span>
                <div><i style={{ left: `${Math.max(0, Math.min(100, ((team.age - 22) / 8) * 100))}%` }} /></div>
                <strong>{team.age.toFixed(1)}</strong>
              </div>
            ))}
          </div>
          <div className="age-axis"><span>22</span><span>26</span><span>30</span></div>
        </article>
      </div>
    </section>
  );
}

function ChaosBoard({ season }: { season: AdvancedSeason }) {
  const wrapped = season.wrapped;
  if (!wrapped) return null;
  const topGames = wrapped.biggestGames.filter((game) => game.rank === 1);
  const upsets = wrapped.upsets.slice(0, 5);
  const maxUpset = Math.max(...upsets.map((game) => game.magnitude), 1);

  return (
    <section className="chaos-section section-pad" id="chaos">
      <SectionIntro index="11" kicker="Volatility department" title="Chaos theory" copy="The positional eruptions, improbable upsets, traveling roster grenades, and two performances that bent an entire matchup." />
      <div className="standout-grid">
        {wrapped.standouts.map((item, index) => (
          <article className={`standout-card ${index ? "yellow" : "red"}`} key={item.type}>
            <span>{item.type}</span><strong>{item.points.toFixed(1)}</strong><h3>{item.player}</h3><p>{item.team} / Week {item.week} / {item.carryPct.toFixed(1)}% of team points</p>
          </article>
        ))}
      </div>
      <div className="chaos-grid">
        <article className="chart-card dark reveal">
          <ChartHeader title="Biggest game at each position" note="Position rank No. 1" />
          <div className="position-games">
            {topGames.map((game) => (
              <div key={game.position}><span>{game.position}</span><strong>{game.points.toFixed(1)}</strong><b>{game.player}</b><small>{game.team} / W{game.week}</small></div>
            ))}
          </div>
        </article>
        <article className="chart-card reveal">
          <ChartHeader title="Biggest upsets" note="Power-win probability gap" />
          <div className="bar-ledger upset-bars">
            {upsets.map((game) => (
              <div className="bar-row" key={`${game.week}-${game.winner}`}>
                <span>{game.winner}<small> over {game.loser} / W{game.week}</small></span>
                <div className="single-track"><i style={{ width: `${(game.magnitude / maxUpset) * 100}%` }} /></div>
                <strong>{game.magnitude.toFixed(1)}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
      <div className="grenade-strip reveal">
        <div><span className="eyebrow">Puff, puff, pass</span><h3>Most-traveled roster grenades</h3></div>
        {wrapped.grenades.slice(0, 6).map((player) => (
          <article key={player.player}><span>{player.position}</span><strong>{player.player}</strong><small>{player.teams} teams / {player.starts} starts / {player.points.toFixed(1)} pts</small></article>
        ))}
      </div>
    </section>
  );
}

function HonorsBoard({ season }: { season: AdvancedSeason }) {
  const wrapped = season.wrapped;
  if (!wrapped) return null;
  const honors = [...wrapped.teamHonors].sort((a, b) => b.net - a.net);
  const pickups = [...wrapped.pickups].sort((a, b) => b.startedPoints - a.startedPoints).slice(0, 10);
  const maxNet = Math.max(...honors.map((team) => Math.abs(team.net)), 1);

  return (
    <section className="honors-section section-pad" id="honors">
      <SectionIntro index="12" kicker="The full ballot" title="Honors and steals" copy="All-League selections, Bush League misses, and the free-agent pickups that generated the most starter points." />
      <div className="honor-net reveal">
        <ChartHeader title="All-League net rating" note="Weekly All-League minus Bush League selections" />
        {honors.map((team) => (
          <div className="net-row" key={team.team}>
            <span>{team.team}</span>
            <div className="net-axis"><i className={team.net >= 0 ? "net-positive" : "net-negative"} style={{ width: `${(Math.abs(team.net) / maxNet) * 50}%` }} /></div>
            <strong>{team.net > 0 ? "+" : ""}{team.net}</strong>
          </div>
        ))}
      </div>
      <div className="honors-grid">
        <article className="all-affl-board reveal">
          <ChartHeader title="All-AFFL teams" note="Season-long performance ballot" />
          <div>
            {wrapped.allLeague.map((player) => (
              <article key={`${player.team}-${player.position}`}>
                <span>{player.team === 1 ? "1st" : player.team === 2 ? "2nd" : "Bush"} / {player.position}</span>
                <strong>{player.player}</strong>
                <small>{player.points.toFixed(1)} pts / {player.starts} starts</small>
              </article>
            ))}
          </div>
        </article>
        <article className="pickup-board reveal">
          <ChartHeader title="Free-agent steals" note="Starter points after pickup" />
          {pickups.map((player, index) => (
            <div className="pickup-row" key={`${player.player}-${index}`}>
              <em>{String(index + 1).padStart(2, "0")}</em>
              <span><strong>{player.player}</strong><small>{player.team} / added W{player.week}</small></span>
              <span><strong>{player.startedPoints.toFixed(1)}</strong><small>{player.starts} starts</small></span>
            </div>
          ))}
        </article>
      </div>
      <div className="module-manifest reveal">
        <span>Wrapped source manifest</span>
        <div>{wrapped.modules.map((module) => <b key={module.id}>{module.id.replaceAll("_", " ")} <small>{module.status === "replaced" ? "ESPN replacement" : `${module.rows} rows`}</small></b>)}</div>
      </div>
    </section>
  );
}

export function AdvancedWrapped({ season: seasonNumber }: { season: number }) {
  const season = getAdvancedSeason(seasonNumber);
  if (!season) return null;
  return (
    <>
      <FrontOffice season={season} />
      <DecisionRoom season={season} />
      <TalentOrigin season={season} />
      <RosterBurden season={season} />
      <ChaosBoard season={season} />
      <HonorsBoard season={season} />
    </>
  );
}
