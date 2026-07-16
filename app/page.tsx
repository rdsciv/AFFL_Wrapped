import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, Mark, TrophyIcon } from "./components/Mark";
import { SiteHeader } from "./components/SiteHeader";
import { advanced } from "./lib/advanced";
import { seasons, stories } from "./lib/data";

export const metadata: Metadata = {
  title: "AFFL History / Season Annuals",
  description: "Twelve seasons of AFFL champions, power rankings, luck, player impact, and matchup history.",
};

export default function Home() {
  const latest = stories[String(seasons[0])];
  const totalPoints = Object.values(stories).reduce((sum, story) => sum + story.pulse.totalPoints, 0);
  return (
    <main className="archive-shell">
      <SiteHeader />
      <section className="archive-hero">
        <div className="archive-mark"><Mark /></div>
        <div className="archive-copy reveal">
          <span className="eyebrow">The official league record / 2014-2025</span>
          <h1>Every season<br /><em>left a mark.</em></h1>
          <p>Twelve years of titles, heartbreak, schedule luck, waiver work, record scores, and players who carried the whole operation.</p>
          <Link href={`/wrapped/${latest.season}`} className="primary-link">Open {latest.season} Wrapped <ArrowIcon /></Link>
        </div>
        <div className="archive-ledger reveal">
          <div><span>Seasons</span><strong>{seasons.length}</strong></div>
          <div><span>League points</span><strong>{Math.round(totalPoints).toLocaleString()}</strong></div>
          <div><span>Latest champion</span><strong>{latest.champion.name}</strong></div>
        </div>
      </section>

      <section className="lab-entry section-pad">
        <div className="lab-entry-copy reveal">
          <span className="eyebrow">New / Front-office intelligence</span>
          <h2>The transaction lab</h2>
          <p>Search every covered add and drop, compare expected points with actual starter production, and inspect inferred roster-to-roster movement without confusing it for official trade history.</p>
          <Link href="/transactions" className="primary-link">Open the ledger <ArrowIcon /></Link>
        </div>
        <div className="lab-entry-stats reveal">
          <article><span>Official counters</span><strong>2014-25</strong></article>
          <article><span>Executed items</span><strong>{advanced.transactions.length.toLocaleString()}</strong></article>
          <article><span>Wrapped modules</span><strong>14</strong></article>
        </div>
      </section>

      <section className="annuals section-pad">
        <div className="annuals-heading">
          <span className="eyebrow">Choose a volume</span>
          <h2>The annuals</h2>
          <p>Each season is rebuilt from the AFFL archive. The 2020-2025 annuals add the complete 14-module advanced Wrapped suite.</p>
        </div>
        <div className="annual-grid">
          {seasons.map((season, index) => {
            const story = stories[String(season)];
            return (
              <Link href={`/wrapped/${season}`} className="annual-card reveal" key={season} style={{ animationDelay: `${(index % 4) * 70}ms` }}>
                <div className="annual-volume">VOL. {String(seasons.length - index).padStart(2, "0")}</div>
                <div className="annual-year">{season}</div>
                <div className="annual-title">{story.mood}</div>
                <div className="annual-champ"><TrophyIcon /><span><small>Champion</small><strong>{story.champion.name}</strong></span></div>
                <div className="annual-bottom"><span>{story.teamCount} teams / {story.regularWeeks} weeks</span><ArrowIcon /></div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="archive-footer">
        <Mark compact />
        <p>Built from the validated ESPN history archive for AFFL League 51418.</p>
        <span>Data through 2025</span>
      </footer>
    </main>
  );
}
