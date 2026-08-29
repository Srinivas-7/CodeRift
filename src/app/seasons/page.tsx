import { db } from "@/lib/db";
import { SeasonsClient } from "@/components/seasons/SeasonsClient";

export const dynamic = "force-dynamic";

export default async function SeasonsPage() {
  let currentSeason: any = null;
  try {
    currentSeason = await db.season.findFirst({
      where: { isActive: true },
    });
  } catch (err) {
    console.error("Seasons fetch error:", err);
  }

  // Normalize dates to ISO strings for client transfer
  const serializedSeason = currentSeason
    ? {
        ...currentSeason,
        startDate: currentSeason.startDate instanceof Date ? currentSeason.startDate.toISOString() : currentSeason.startDate,
        endDate: currentSeason.endDate instanceof Date ? currentSeason.endDate.toISOString() : currentSeason.endDate,
      }
    : null;

  return <SeasonsClient initialSeason={serializedSeason} />;
}
