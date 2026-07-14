import Link from "next/link";
import { formatPoints, seasons, signed, type SeasonStory } from "../lib/data";
import { ArrowIcon, TrophyIcon } from "./Mark";
import { SeasonRail } from "./SeasonRail";
import { SiteHeader } from "./SiteHeader";

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

function Rank({ value }: { value: number }) {
  const suffix = value === 1 ? "ST" : value === 2 ? "ND" : value === 3 ? "RD" : "TH";
  return <span className="rank">{value}<sup>{suffix}</sup></span>;
}

function Scoreline({ story }: { story: SeasonStory }) {
  const game = story.titleGame;
  const homeWon = game.homeScore >= game.awayScore;
  return (
    <div className="scoreline-card reveal" id="title-game">
      <div className="scoreline-topline">
        <span>Championship</span>
        <span>Week {game.week}</span>
      </div>
      <div className={`score-team ${homeWon ? "winner" : ""}`}>
        <span>{game.home}</span>
        <strong>{game.homeScore.toFixed(2)}</strong>
      </div>
      <div className={`score-team ${!homeWon ? "winner" : ""}`}>
        <span>{game.away}</span>
        <strong>{game.awayScore.toFixed(2)}</strong>
      </div>
      <div className="scoreline-footer">
        <span>Final margin</span>
        <strong>{game.margin.toFixed(2)}</strong>
      </div>
    </div>
  );
}

function PowerTable({ story }: { story: SeasonStory }) {
  const max = Math.max(...story.powerStandings.map((team) => team.expectedWins));
  return (
    <div className="power-table reveal">
      <div className="table-head">
        <span>Power</span><span>Team</span><span>All-play</span><span>Actual</span><span>Luck</span>
      </div>
      {story.powerStandings.map((team, index) => (
        <div className="power-row" key={team.id}>
          <span className="power-rank">{String(index + 1).padStart(2, "0")}</span>
          <div className="power-team">
            <strong>{team.name}</strong>
            <div className="power-bar"><i style={{ width: `${(team.expectedWins / max) * 100}%` }} /></div>
          </div>
          <span>{team.expectedWins.toFixed(2)}</span>
          <span>{team.wins}</span>
          <span className={team.luck >= 0 ? "positive" : "negative"}>{signed(team.luck)}</span>
        </div>
      ))}
    </div>
  );
}

function MatchupCards({ story }: { story: SeasonStory }) {
  return (
    <div className="award-grid">
      {story.matchupAwards.map((award, index) => (
        <article className="matchup-card reveal" key={award.label} style={{ animationDelay: `${index * 70}ms` }}>
          <div className="award-number">0{index + 1}</div>
          <span className="eyebrow">Week {award.week}</span>
          <h3>{award.label}</h3>
          <p>{award.note}</p>
          <div className="mini-score">
            <div><span>{award.home}</span><strong>{award.homeScore.toFixed(2)}</strong></div>
            <div><span>{award.away}</span><strong>{award.awayScore.toFixed(2)}</strong></div>
          </div>
          <div className="card-stat"><span>{award.label === "Closest Nail-Biter" || award.label === "Biggest Blowout" ? "Margin" : "Combined"}</span><strong>{award.label === "Closest Nail-Biter" || award.label === "Biggest Blowout" ? award.margin.toFixed(2) : award.combined.toFixed(2)}</strong></div>
        </article>
      ))}
    </div>
  );
}

function PlayerSections({ story }: { story: SeasonStory }) {
  return (
    <div className="player-layout">
      <div className="feature-awards">
        <article className="player-feature red reveal">
          <span className="eyebrow">Single-game eruption</span>
          <div className="mega-number">{story.playerAwards.singleGame.points.toFixed(1)}</div>
          <h3>{story.playerAwards.singleGame.name}</h3>
          <p>{story.playerAwards.singleGame.team} / Week {story.playerAwards.singleGame.week}</p>
        </article>
        <article className="player-feature ink reveal">
          <span className="eyebrow">Carried the team</span>
          <div className="mega-number">{story.playerAwards.carried.share.toFixed(1)}%</div>
          <h3>{story.playerAwards.carried.name}</h3>
          <p>{story.playerAwards.carried.points.toFixed(1)} points for {story.playerAwards.carried.team}</p>
        </article>
      </div>
      <div className="leader-list reveal">
        <div className="list-title"><span>Season leaders</span><span>PTS</span></div>
        {story.seasonLeaders.map((player, index) => (
          <div className="leader-row" key={`${player.name}-${index}`}>
            <span className="leader-position">{player.position}</span>
            <span><strong>{player.name}</strong><small>High {player.highGame.toFixed(1)}</small></span>
            <strong>{player.points.toFixed(1)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function TalentBoard({ story }: { story: SeasonStory }) {
  const draftLabel = story.coverage.draft ? "Draft board" : "Archive note";
  return (
    <div className="talent-grid">
      <article className="talent-card reveal">
        <span className="eyebrow">{draftLabel}</span>
        <h3>{story.coverage.draft ? "Draft picks that paid" : "Pre-2018 draft detail"}</h3>
        {story.coverage.draft ? story.draftSpotlight.map((pick, index) => (
          <div className="talent-row" key={`${pick.player}-${index}`}>
            <span className="pick-pill">#{pick.pick}</span>
            <span><strong>{pick.player}</strong><small>{pick.team}</small></span>
            <strong>{pick.points.toFixed(1)}</strong>
          </div>
        )) : <p className="coverage-copy">ESPN does not return player-level draft history for this season. The standings, scores, lineups, and acquisition counts remain fully represented.</p>}
      </article>
      <article className="talent-card yellow reveal">
        <span className="eyebrow">Undrafted impact</span>
        <h3>Waiver wire gems</h3>
        {story.waiverGems.map((player, index) => (
          <div className="talent-row" key={`${player.name}-${index}`}>
            <span className="pick-pill">{player.position}</span>
            <span><strong>{player.name}</strong><small>Not on the draft board</small></span>
            <strong>{player.points.toFixed(1)}</strong>
          </div>
        ))}
        {!story.waiverGems.length && <p className="coverage-copy">Player-level waiver identification is not available for this season.</p>}
      </article>
      <article className="talent-card blue reveal">
        <span className="eyebrow">All-AFFL</span>
        <h3>First team</h3>
        <div className="all-league-grid">
          {story.allLeague.map((player) => (
            <div key={player.position}><span>{player.position}</span><strong>{player.name}</strong><small>{player.points.toFixed(1)} pts</small></div>
          ))}
        </div>
      </article>
    </div>
  );
}

function TeamArchive({ story }: { story: SeasonStory }) {
  return (
    <div className="team-archive">
      {story.teams.map((team, index) => (
        <article className={`team-card reveal ${team.rank === 1 ? "champ-card" : ""}`} key={team.id} style={{ animationDelay: `${(index % 5) * 45}ms` }}>
          <div className="team-card-top"><Rank value={team.rank} /><span>{team.record}</span></div>
          <h3>{team.name}</h3>
          <p>{team.owner}</p>
          <dl>
            <div><dt>PF</dt><dd>{formatPoints(team.pointsFor)}</dd></div>
            <div><dt>Power W</dt><dd>{team.expectedWins.toFixed(2)}</dd></div>
            <div><dt>Luck</dt><dd className={team.luck >= 0 ? "positive" : "negative"}>{signed(team.luck)}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

export function WrappedExperience({ story }: { story: SeasonStory }) {
  const older = seasons.find((season) => season < story.season);
  const newer = [...seasons].reverse().find((season) => season > story.season);
  return (
    <main className="wrapped-shell">
      <SiteHeader season={story.season} />
      <section className="hero" id="top">
        <div className="hero-noise" />
        <div className="hero-copy reveal">
          <span className="hero-kicker">AFFL Season Annual / Volume {story.season - 2013}</span>
          <h1><span>{story.season}</span><em>Wrapped</em></h1>
          <p>{story.mood}</p>
          <div className="hero-deck">{story.deck}</div>
        </div>
        <div className="hero-tape"><span>{story.teamCount} teams</span><span>{story.regularWeeks} regular weeks</span><span>{formatPoints(story.pulse.totalPoints)} points</span></div>
        <a href="#champion" className="scroll-cue"><span>Open the annual</span><ArrowIcon /></a>
      </section>

      <SeasonRail active={story.season} />

      <section className="champion-section section-pad" id="champion">
        <SectionIntro index="01" kicker="Last team standing" title="The champion" copy="The regular season built the case. The bracket delivered the verdict." />
        <div className="champion-layout">
          <div className="champion-name reveal">
            <div className="trophy-wrap"><TrophyIcon /></div>
            <span>{story.champion.owner}</span>
            <h3>{story.champion.name}</h3>
            <p>{story.champion.record} / Seed {story.champion.seed} / {formatPoints(story.champion.pointsFor)} PF</p>
          </div>
          <Scoreline story={story} />
        </div>
      </section>

      <section className="pulse-section section-pad">
        <SectionIntro index="02" kicker="Season pulse" title="The year in numbers" copy="A league-level fingerprint built from every regular-season score and every move recorded by ESPN." />
        <div className="pulse-grid">
          <div className="pulse-stat red"><span>Average score</span><strong>{story.pulse.averageScore.toFixed(1)}</strong><small>points per team-week</small></div>
          <div className="pulse-stat cream"><span>High-water mark</span><strong>{story.pulse.highScore.toFixed(2)}</strong><small>{story.pulse.highScoreTeam}, W{story.pulse.highScoreWeek}</small></div>
          <div className="pulse-stat blue"><span>Acquisitions</span><strong>{story.pulse.acquisitions}</strong><small>{story.coverage.transactionEvents ? "event detail available" : "season counters"}</small></div>
          <div className="pulse-stat yellow"><span>Trades</span><strong>{story.pulse.trades}</strong><small>team-reported activity</small></div>
        </div>
      </section>

      <section className="power-section section-pad" id="power">
        <SectionIntro index="03" kicker="No schedule excuses" title="Power and luck" copy="All-play expected wins ask one clean question: how often would your score have beaten the rest of the league that week?" />
        <div className="luck-callouts">
          <article><span>Luckiest</span><strong>{story.luckiest.name}</strong><em>{signed(story.luckiest.luck)} wins</em></article>
          <article><span>Unluckiest</span><strong>{story.unluckiest.name}</strong><em>{signed(story.unluckiest.luck)} wins</em></article>
        </div>
        <PowerTable story={story} />
      </section>

      <section className="matchups-section section-pad" id="matchups">
        <SectionIntro index="04" kicker="Games we remember" title="Matchup awards" copy="The blowout, the nail-biter, the fireworks, and the game nobody is putting on the fridge." />
        <MatchupCards story={story} />
      </section>

      <section className="players-section section-pad" id="players">
        <SectionIntro index="05" kicker="Put the team on my back" title="Player impact" copy="The biggest weekly eruption, the heaviest season-long carry, and the names that owned the scoring table." />
        <PlayerSections story={story} />
      </section>

      <section className="talent-section section-pad" id="talent">
        <SectionIntro index="06" kicker="Roster construction" title="How talent arrived" copy="Draft-day returns, undrafted impact, and the first-team lineup of the season." />
        <TalentBoard story={story} />
        <p className="coverage-note">Source note: {story.coverage.note}</p>
      </section>

      <section className="teams-section section-pad" id="teams">
        <SectionIntro index="07" kicker="Every manager gets a page" title="Team roll call" copy="Final finish, actual record, all-play strength, and schedule luck for every AFFL franchise in the season." />
        <TeamArchive story={story} />
      </section>

      <footer className="wrapped-footer">
        <div><span className="eyebrow">AFFL archive</span><h2>That was {story.season}.</h2><p>One season down. The whole league story is still unfolding.</p></div>
        <div className="footer-nav">
          {older && <Link href={`/wrapped/${older}`}><span>Previous season</span><strong>{older}</strong></Link>}
          {newer && <Link href={`/wrapped/${newer}`}><span>Next season</span><strong>{newer}</strong></Link>}
          <Link href="/"><span>All seasons</span><strong>Archive</strong></Link>
        </div>
        <div className="footer-fine"><span>AFFL / League 51418</span><span>Historical data through 2025</span></div>
      </footer>
    </main>
  );
}
