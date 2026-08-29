import { PrismaClient } from "@prisma/client";
import { SDE_SHEET_PROBLEMS } from "../src/data/sdeSheetProblems";

const prisma = new PrismaClient();

async function main() {
  console.log("⚡ [SEED] Initializing Clean Production DSA ARENA Database...");

  // 1. Clean existing records to ensure completely clean fresh state
  await prisma.notification.deleteMany();
  await prisma.friendChallenge.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.xpTransaction.deleteMany();
  await prisma.streakRecord.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.userProblemStatus.deleteMany();
  await prisma.dailyChallenge.deleteMany();
  await prisma.groupSeason.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.season.deleteMany();
  await prisma.problem.deleteMany();

  console.log("✓ Database wiped. Zero fake users, zero fake groups, zero fake submissions.");

  // 2. Seed strictly the official 191 Striver's SDE Sheet problems
  console.log(`📦 Seeding ${SDE_SHEET_PROBLEMS.length} Striver's SDE Sheet problems...`);
  for (const prob of SDE_SHEET_PROBLEMS) {
    await prisma.problem.create({
      data: {
        id: prob.id,
        title: prob.title,
        topic: prob.category,
        category: prob.category,
        difficulty: prob.difficulty,
        orderInSheet: prob.orderInSheet,
        leetcodeUrl: prob.leetcodeUrl || null,
        articleUrl: prob.articleUrl || null,
        youtubeUrl: prob.youtubeUrl || null,
        description: prob.description,
        hint: prob.hint || null,
        constraints: prob.constraints || null,
        examplesJson: prob.examplesJson || null,
      },
    });
  }
  console.log(`✓ 191 Striver SDE Sheet problems seeded successfully.`);

  // 3. Seed System Achievement Definitions
  console.log("🏆 Seeding System Achievement Definitions...");
  const ACHIEVEMENTS = [
    {
      id: "streak_7",
      name: "7-Day Streak",
      description: "Solved daily missions for 7 consecutive days.",
      icon: "🔥",
      xpReward: 250,
      category: "STREAK",
      tier: "BRONZE",
    },
    {
      id: "streak_30",
      name: "30-Day Legend",
      description: "Maintained a relentless 30-day daily problem streak.",
      icon: "⚡",
      xpReward: 1000,
      category: "STREAK",
      tier: "GOLD",
    },
    {
      id: "first_10",
      name: "First 10 Cleared",
      description: "Conquered your first 10 problems from Striver's SDE Sheet.",
      icon: "💯",
      xpReward: 200,
      category: "PROBLEMS",
      tier: "BRONZE",
    },
    {
      id: "half_century_50",
      name: "Half Century (50 Problems)",
      description: "Solved 50 core interview problems.",
      icon: "🎯",
      xpReward: 500,
      category: "PROBLEMS",
      tier: "SILVER",
    },
    {
      id: "century_100",
      name: "Century (100 Problems)",
      description: "Reached 100 problems in the SDE Sheet roadmap.",
      icon: "⚔️",
      xpReward: 1000,
      category: "PROBLEMS",
      tier: "GOLD",
    },
    {
      id: "sde_master_191",
      name: "191 SDE Sheet Master",
      description: "Completed every single problem in Striver's 191 SDE Sheet.",
      icon: "💎",
      xpReward: 5000,
      category: "PROBLEMS",
      tier: "DIAMOND",
    },
    {
      id: "podium_top3",
      name: "Podium Finisher",
      description: "Reached Top 3 on your squad's leaderboard.",
      icon: "🏆",
      xpReward: 300,
      category: "LEADERBOARD",
      tier: "SILVER",
    },
    {
      id: "season_champion",
      name: "Season Champion",
      description: "Finished #1 in a 30-day squad season.",
      icon: "👑",
      xpReward: 2000,
      category: "SEASONS",
      tier: "DIAMOND",
    },
  ];

  for (const ach of ACHIEVEMENTS) {
    await prisma.achievement.create({ data: ach });
  }
  console.log(`✓ ${ACHIEVEMENTS.length} Achievement definitions seeded.`);

  // 4. Seed Active Season 01
  await prisma.season.create({
    data: {
      name: "Season 01 Arena",
      seasonNumber: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });
  console.log("✓ Season 01 Arena initialized.");

  console.log("🚀 [SEED COMPLETE] Production database is completely clean and ready for real users!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
