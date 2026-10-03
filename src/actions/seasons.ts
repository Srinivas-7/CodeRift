"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const UpdateSeasonSchema = z.object({
  seasonId: z.string().trim().max(64).optional(),
  startDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}/, "Start date must be in YYYY-MM-DD format"),
  endDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}/, "End date must be in YYYY-MM-DD format").optional(),
});

export async function updateSeasonDates(data: {
  seasonId?: string;
  startDate: string;
  endDate?: string;
}) {
  const parsed = UpdateSeasonSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid season parameters." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return {
      success: false,
      error: "Unauthorized. Administrator privileges required.",
    };
  }

  const { seasonId, startDate, endDate } = parsed.data;


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

