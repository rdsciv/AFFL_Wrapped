import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WrappedExperience } from "../../components/WrappedExperience";
import { getStory, seasons } from "../../lib/data";

export function generateStaticParams() {
  return seasons.map((season) => ({ season: String(season) }));
}

export async function generateMetadata({ params }: { params: Promise<{ season: string }> }): Promise<Metadata> {
  const { season } = await params;
  const story = getStory(season);
  if (!story) return {};
  return {
    title: `${story.season} AFFL Wrapped`,
    description: `${story.mood}: ${story.champion.name} won the ${story.season} AFFL championship.`,
  };
}

export default async function WrappedSeason({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const story = getStory(season);
  if (!story) notFound();
  return <WrappedExperience story={story} />;
}
