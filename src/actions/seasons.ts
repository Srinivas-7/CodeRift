"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateSeasonDates(data: {
  seasonId?: string;
  startDate: string;
  endDate?: string;
  password: string;
}) {
  if (data.password !== "DSA321") {
    return {
      success: false,
      error: "Incorrect admin password. Access denied.",
    };
  }

  if (!data.startDate) {
    return {
      success: false,
      error: "Please provide a valid start date.",
    };
  }

  try {
    const start = new Date(data.startDate);
    if (isNaN(start.getTime())) {
      return { success: false, error: "Invalid start date format." };
    }

    let end: Date;
    if (data.endDate) {
      end = new Date(data.endDate);
      if (isNaN(end.getTime())) {
        end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const updated = await db.season.update({
      where: { id: data.seasonId || "season_1" },
      data: {
        startDate: start,
        endDate: end,
      },
    });

    revalidatePath("/seasons");
    revalidatePath("/dashboard");
    revalidatePath("/leaderboard");

    return {
      success: true,
      season: updated,
      message: `Season cycle updated successfully: ${start.toLocaleDateString()} — ${end.toLocaleDateString()}`,
    };
  } catch (err: any) {
    console.error("Failed to update season date:", err);
    return {
      success: false,
      error: err.message || "Failed to update season date.",
    };
  }
}
