"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getProblemScore } from "@/lib/scoring";
import { getLevelInfo } from "@/lib/xp";
import {
  Trophy,
  Award,
  Zap,
  CheckCircle2,
  Calendar,
  Swords,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Layers,
  ChevronRight,
  Sparkles,
  BookOpen,
} from "lucide-react";

export interface AchievedPointItem {
  id: string;
  type: "PROBLEM" | "DAILY_BONUS" | "DUEL" | "ACHIEVEMENT" | "XP_LOG";
  title: string;
  subtitle: string;
  points: number;
  difficulty?: "Easy" | "Medium" | "Hard";
  topic?: string;
  category?: string;
  problemId?: number;
  date: Date;
  icon?: string;
  tagLabel?: string;
}

interface ProfileProgressSectionProps {
  user: any;
  userAchievements: any[];
  groupMemberships: any[];
  xpTransactions: any[];
  userProblemStatuses: any[];
  allProblems: any[];
  completedDailies: any[];
  wonDuels: any[];
}

export function ProfileProgressSection({
  user,
  userAchievements = [],
  groupMemberships = [],
  xpTransactions = [],
  userProblemStatuses = [],
  allProblems = [],
  completedDailies = [],
  wonDuels = [],
}: ProfileProgressSectionProps) {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"NEWEST" | "POINTS_DESC" | "OLDEST">("NEWEST");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const levelInfo = getLevelInfo(user.score ?? user.xp ?? 0);

  // Map problems by id for fast lookup
  const problemsMap = useMemo(() => {
    const map = new Map<number, any>();
    for (const p of allProblems) {
      map.set(p.id, p);
    }
    return map;
  }, [allProblems]);

  // Solved statuses set
  const solvedStatuses = useMemo(() => {
    return userProblemStatuses.filter(
      (s) => s.status === "SOLVED" || s.status === "OPTIMAL"
    );
  }, [userProblemStatuses]);

  // Calculate difficulty points & counts
  const difficultyStats = useMemo(() => {
    let easyCount = 0;
    let easyPoints = 0;
    let mediumCount = 0;
    let mediumPoints = 0;
    let hardCount = 0;
    let hardPoints = 0;

    let totalEasy = 0;
    let totalMedium = 0;
    let totalHard = 0;

    for (const p of allProblems) {
      if (p.difficulty === "Easy") totalEasy++;
      else if (p.difficulty === "Medium") totalMedium++;
      else if (p.difficulty === "Hard") totalHard++;
    }

    for (const s of solvedStatuses) {
      const p = problemsMap.get(s.problemId);
      if (!p) continue;
      if (p.difficulty === "Easy") {
        easyCount++;
        easyPoints += 10;
      } else if (p.difficulty === "Medium") {
        mediumCount++;
        mediumPoints += 20;
      } else if (p.difficulty === "Hard") {
        hardCount++;
        hardPoints += 30;
      }
    }

    return {
      easy: { count: easyCount, total: totalEasy || 44, points: easyPoints },
      medium: { count: mediumCount, total: totalMedium || 119, points: mediumPoints },
      hard: { count: hardCount, total: totalHard || 28, points: hardPoints },
      totalProblemPoints: easyPoints + mediumPoints + hardPoints,
    };
  }, [solvedStatuses, allProblems, problemsMap]);

  // Calculate Topic Breakdown
  const topicStats = useMemo(() => {
    const map = new Map<
      string,
      { topic: string; solved: number; total: number; points: number; maxPoints: number }
    >();

    for (const p of allProblems) {
      const topic = p.topic || p.category || "General";
      if (!map.has(topic)) {
        map.set(topic, { topic, solved: 0, total: 0, points: 0, maxPoints: 0 });
      }
      const entry = map.get(topic)!;
      entry.total++;
      entry.maxPoints += getProblemScore(p.difficulty);
    }

    for (const s of solvedStatuses) {
      const p = problemsMap.get(s.problemId);
      if (!p) continue;
      const topic = p.topic || p.category || "General";
      if (map.has(topic)) {
        const entry = map.get(topic)!;
        entry.solved++;
        entry.points += getProblemScore(p.difficulty);
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      // Sort by points earned descending, then total problems
      if (b.points !== a.points) return b.points - a.points;
      return b.total - a.total;
    });
  }, [allProblems, solvedStatuses, problemsMap]);

  // Calculate Bonus points
  const dailyBonusPoints = completedDailies.length * 20;
  const duelBonusPoints = wonDuels.reduce((acc, d) => acc + (d.xpStake || 150), 0);
  const achievementBonusPoints = userAchievements.reduce(
    (acc, ua) => acc + (ua.achievement?.xpReward || 0),
    0
  );

  // Total points achieved aggregate
  const totalVerifiedPoints =
    difficultyStats.totalProblemPoints +
    dailyBonusPoints +
    duelBonusPoints +
    achievementBonusPoints;

  const displayTotalScore = user.score ?? user.xp ?? totalVerifiedPoints;

  // Build unified itemized points ledger
  const allAchievedPoints = useMemo(() => {
    const items: AchievedPointItem[] = [];

    // 1. Problem Solves
    for (const s of solvedStatuses) {
      const p = problemsMap.get(s.problemId);
      if (!p) continue;
      const pts = getProblemScore(p.difficulty);
      const dateVal = s.firstSolvedAt || s.lastAttemptedAt || s.createdAt || new Date();

      items.push({
        id: `prob_${s.id || s.problemId}`,
        type: "PROBLEM",
        title: p.title,
        subtitle: `${p.topic || p.category || "SDE Sheet"} • #${p.orderInSheet || p.id}`,
        points: pts,
        difficulty: p.difficulty,
        topic: p.topic || p.category,
        category: p.category,
        problemId: p.id,
        date: new Date(dateVal),
        tagLabel: `${p.difficulty} Problem Solved`,
      });
    }

    // 2. Daily Mission Bonuses
    for (const d of completedDailies) {
      const dateVal = d.completedAt || d.createdAt || new Date();
      items.push({
        id: `daily_${d.id || d.date}`,
        type: "DAILY_BONUS",
        title: "Daily 3 Mission Cleared",
        subtitle: `Batch Date: ${d.date}${d.groupId ? " • Squad Arena Challenge" : " • Solo Challenge"}`,
        points: 20,
        date: new Date(dateVal),
        icon: "🎉",
        tagLabel: "Daily Batch Bonus",
      });
    }

    // 3. Won Duels
    for (const w of wonDuels) {
      const dateVal = w.completedAt || w.createdAt || new Date();
      const duelXp = w.xpStake || 150;
      items.push({
        id: `duel_${w.id}`,
        type: "DUEL",
        title: "1v1 Arena Duel Victory",
        subtitle: "Conquered 1v1 Challenge Stake",
        points: duelXp,
        date: new Date(dateVal),
        icon: "⚔️",
        tagLabel: "Duel Victory Stake",
      });
    }

    // 4. Achievement Badges
    for (const ua of userAchievements) {
      const dateVal = ua.unlockedAt || ua.createdAt || new Date();
      const ach = ua.achievement;
      if (ach && (ach.xpReward || 0) > 0) {
        items.push({
          id: `ach_${ua.id || ua.achievementId}`,
          type: "ACHIEVEMENT",
          title: `${ach.name} Badge Claimed`,
          subtitle: ach.description || "Achievement Milestone Unlocked",
          points: ach.xpReward,
          date: new Date(dateVal),
          icon: ach.icon || "🏆",
          tagLabel: `${ach.tier || "Milestone"} Badge`,
        });
      }
    }

    // 5. XP Transactions fallback (include any non-duplicate transaction)
    const existingKeys = new Set(items.map((i) => `${i.type}_${i.points}_${i.date.getTime()}`));
    for (const tx of xpTransactions) {
      const dateVal = tx.createdAt || new Date();
      const key = `XP_LOG_${tx.amount}_${new Date(dateVal).getTime()}`;
      if (!existingKeys.has(key) && tx.amount > 0 && tx.reason !== "PROBLEM_SOLVE") {
        items.push({
          id: `tx_${tx.id}`,
          type: "XP_LOG",
          title: `Arena Bonus: ${tx.reason || "Reward"}`,
          subtitle: `Recorded Transaction #${tx.id.slice(0, 8)}`,
          points: tx.amount,
          date: new Date(dateVal),
          icon: "⚡",
          tagLabel: tx.reason || "Arena Reward",
        });
      }
    }

    return items;
  }, [solvedStatuses, problemsMap, completedDailies, wonDuels, userAchievements, xpTransactions]);

  // Filter & Search & Sort
  const filteredItems = useMemo(() => {
    let list = [...allAchievedPoints];

    // Filter by type
    if (filterType === "PROBLEMS") {
      list = list.filter((i) => i.type === "PROBLEM");
    } else if (filterType === "DAILY") {
      list = list.filter((i) => i.type === "DAILY_BONUS");
    } else if (filterType === "DUELS_BADGES") {
      list = list.filter((i) => i.type === "DUEL" || i.type === "ACHIEVEMENT");
    }

    // Filter by difficulty
    if (filterDifficulty !== "ALL") {
      list = list.filter((i) => i.difficulty === filterDifficulty);
    }

    // Filter by selected topic chip
    if (selectedTopic) {
      list = list.filter((i) => i.topic === selectedTopic || i.category === selectedTopic);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.subtitle.toLowerCase().includes(q) ||
          (i.topic && i.topic.toLowerCase().includes(q)) ||
          (i.tagLabel && i.tagLabel.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "NEWEST") {
      list.sort((a, b) => b.date.getTime() - a.date.getTime());
    } else if (sortBy === "OLDEST") {
      list.sort((a, b) => a.date.getTime() - b.date.getTime());
    } else if (sortBy === "POINTS_DESC") {
      list.sort((a, b) => b.points - a.points || b.date.getTime() - a.date.getTime());
    }

    return list;
  }, [allAchievedPoints, filterType, filterDifficulty, selectedTopic, searchQuery, sortBy]);

  // Phase scores
  const phase1Solved = user.phase1Solved || 0;
  const phase2Solved = user.phase2Solved || 0;
  const phase1Score = user.phase1Score || 0;
  const phase2Score = user.phase2Score || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* 1. HERO POINTS OVERVIEW STATS */}
      <div
        className="editorial-card"
        style={{
          padding: "2.5rem 2rem",
          background: "linear-gradient(180deg, rgba(33, 72, 255, 0.08) 0%, var(--bg-surface) 100%)",
          border: "2px solid var(--border-cobalt)",
          borderRadius: "6px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem" }}>
          <div>
            <span className="editorial-stamp" style={{ borderColor: "var(--accent-cobalt)", color: "var(--accent-cobalt)", marginBottom: "0.5rem" }}>
              ARENA PROGRESSION & POINTS AUDIT
            </span>
            <h2 className="font-grotesk" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", textTransform: "uppercase", color: "#FFF", marginTop: "0.3rem" }}>
              ALL POINTS ACHIEVED
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "600px", marginTop: "0.4rem" }}>
              Track every point earned across LeetCode problem verifications, daily 3-mission clearing bonuses, 1v1 duels, and milestone badges.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-editorial-strong)",
              padding: "1rem 1.5rem",
              borderRadius: "4px",
            }}
          >
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                WARRIOR LEVEL {levelInfo.level}
              </div>
              <div className="font-serif" style={{ fontSize: "2rem", color: "var(--accent-cobalt)", lineHeight: 1 }}>
                {displayTotalScore.toLocaleString()}{" "}
                <span style={{ fontSize: "1rem", fontFamily: "var(--font-mono)", color: "#FFF" }}>PTS</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                {levelInfo.xpToNext > 0 ? `${levelInfo.xpToNext} PTS to Level ${levelInfo.level + 1}` : "Max Rank"}
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(33, 72, 255, 0.15)",
                border: "1px solid var(--accent-cobalt)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-cobalt)",
              }}
            >
              <Zap size={24} />
            </div>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "0.75rem", marginBottom: "0.4rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>
              Level {levelInfo.level} Progress ({levelInfo.xpInCurrentLevel} / {levelInfo.nextLevelMinXp - levelInfo.currentLevelMinXp} PTS)
            </span>
            <span style={{ color: "var(--accent-cobalt)", fontWeight: 700 }}>{levelInfo.progressPercent}%</span>
          </div>
          <div className="progress-bar-bg" style={{ height: "6px", borderRadius: "3px", overflow: "hidden" }}>
            <div className="progress-bar-fill-cobalt" style={{ width: `${levelInfo.progressPercent}%` }} />
          </div>
        </div>

        {/* 4 CATEGORY POINT CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {/* Card 1: Problem Points */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-editorial)",
              borderRadius: "4px",
              padding: "1.25rem",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Problem Solves
              </span>
              <BookOpen size={16} color="var(--accent-cobalt)" />
            </div>
            <div className="font-serif" style={{ fontSize: "1.8rem", color: "#FFF", lineHeight: 1 }}>
              {difficultyStats.totalProblemPoints.toLocaleString()}{" "}
              <span style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--accent-cobalt)" }}>PTS</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
              {user.totalSolved || solvedStatuses.length} / 191 Problems Solved
            </div>
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem" }}>
              <span className="badge-diff-easy" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
                {difficultyStats.easy.count} Easy ({difficultyStats.easy.points}p)
              </span>
              <span className="badge-diff-medium" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
                {difficultyStats.medium.count} Med ({difficultyStats.medium.points}p)
              </span>
              <span className="badge-diff-hard" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
                {difficultyStats.hard.count} Hard ({difficultyStats.hard.points}p)
              </span>
            </div>
          </div>

          {/* Card 2: Daily Mission Bonuses */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-editorial)",
              borderRadius: "4px",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Daily 3 Bonuses
              </span>
              <Calendar size={16} color="var(--accent-acid)" />
            </div>
            <div className="font-serif" style={{ fontSize: "1.8rem", color: "#FFF", lineHeight: 1 }}>
              {dailyBonusPoints.toLocaleString()}{" "}
              <span style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--accent-acid)" }}>PTS</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
              {completedDailies.length} Daily Missions Cleared
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--accent-acid)", marginTop: "0.75rem" }}>
              +20 PTS per 3-problem daily mission
            </div>
          </div>

          {/* Card 3: 1v1 Duels Stake */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-editorial)",
              borderRadius: "4px",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                1v1 Duel Stakes
              </span>
              <Swords size={16} color="var(--accent-vermillion)" />
            </div>
            <div className="font-serif" style={{ fontSize: "1.8rem", color: "#FFF", lineHeight: 1 }}>
              {duelBonusPoints.toLocaleString()}{" "}
              <span style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--accent-vermillion)" }}>PTS</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
              {wonDuels.length} PvP Duels Won
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--accent-vermillion)", marginTop: "0.75rem" }}>
              +150 XP stake won per victory
            </div>
          </div>

          {/* Card 4: Badge Rewards */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-editorial)",
              borderRadius: "4px",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Badge Rewards
              </span>
              <Award size={16} color="var(--accent-amber)" />
            </div>
            <div className="font-serif" style={{ fontSize: "1.8rem", color: "#FFF", lineHeight: 1 }}>
              {achievementBonusPoints.toLocaleString()}{" "}
              <span style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>PTS</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
              {userAchievements.length} Badges Claimed
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--accent-amber)", marginTop: "0.75rem" }}>
              Milestone achievements unlocked
            </div>
          </div>
        </div>
      </div>

      {/* 2. PHASE & DIFFICULTY PROGRESS SECTION */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Phase 1 & Phase 2 Breakdown */}
        <div className="editorial-card" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <Layers size={18} color="var(--accent-cobalt)" />
            <h3 className="font-grotesk" style={{ fontSize: "1.1rem", textTransform: "uppercase", color: "#FFF" }}>
              ROADMAP PHASES PROGRESS
            </h3>
          </div>

          {/* Phase 1 */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <div>
                <span style={{ fontWeight: 700, color: "#FFF", fontSize: "0.95rem" }}>Phase 1 (Problems 1–96)</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                  Core Foundations
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--accent-cobalt)", fontWeight: 700 }}>
                {phase1Solved} / 96 Solved ({phase1Score} PTS)
              </span>
            </div>
            <div className="progress-bar-bg" style={{ height: "6px", borderRadius: "3px", overflow: "hidden" }}>
              <div
                className="progress-bar-fill-cobalt"
                style={{ width: `${Math.min(100, Math.round((phase1Solved / 96) * 100))}%` }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
              <span>{Math.round((phase1Solved / 96) * 100)}% Complete</span>
              <span>{96 - phase1Solved} Remaining</span>
            </div>
          </div>

          {/* Phase 2 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <div>
                <span style={{ fontWeight: 700, color: "#FFF", fontSize: "0.95rem" }}>Phase 2 (Problems 97–191)</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                  Advanced Mastery
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--accent-acid)", fontWeight: 700 }}>
                {phase2Solved} / 95 Solved ({phase2Score} PTS)
              </span>
            </div>
            <div className="progress-bar-bg" style={{ height: "6px", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: "var(--accent-acid)",
                  width: `${Math.min(100, Math.round((phase2Solved / 95) * 100))}%`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
              <span>{Math.round((phase2Solved / 95) * 100)}% Complete</span>
              <span>{95 - phase2Solved} Remaining</span>
            </div>
          </div>
        </div>

        {/* Difficulty Distribution Card */}
        <div className="editorial-card" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <TrendingUp size={18} color="var(--accent-amber)" />
            <h3 className="font-grotesk" style={{ fontSize: "1.1rem", textTransform: "uppercase", color: "#FFF" }}>
              DIFFICULTY POINTS DISTRIBUTION
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Easy */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <span className="badge-diff-easy">EASY (10 PTS EACH)</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-acid)", fontWeight: 700 }}>
                  {difficultyStats.easy.count} / {difficultyStats.easy.total} ({difficultyStats.easy.points} PTS)
                </span>
              </div>
              <div className="progress-bar-bg" style={{ height: "4px" }}>
                <div
                  style={{
                    height: "100%",
                    background: "var(--accent-acid)",
                    width: `${Math.min(100, Math.round((difficultyStats.easy.count / difficultyStats.easy.total) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <span className="badge-diff-medium">MEDIUM (20 PTS EACH)</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-amber)", fontWeight: 700 }}>
                  {difficultyStats.medium.count} / {difficultyStats.medium.total} ({difficultyStats.medium.points} PTS)
                </span>
              </div>
              <div className="progress-bar-bg" style={{ height: "4px" }}>
                <div
                  style={{
                    height: "100%",
                    background: "var(--accent-amber)",
                    width: `${Math.min(100, Math.round((difficultyStats.medium.count / difficultyStats.medium.total) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Hard */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <span className="badge-diff-hard">HARD (30 PTS EACH)</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-vermillion)", fontWeight: 700 }}>
                  {difficultyStats.hard.count} / {difficultyStats.hard.total} ({difficultyStats.hard.points} PTS)
                </span>
              </div>
              <div className="progress-bar-bg" style={{ height: "4px" }}>
                <div
                  style={{
                    height: "100%",
                    background: "var(--accent-vermillion)",
                    width: `${Math.min(100, Math.round((difficultyStats.hard.count / difficultyStats.hard.total) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOPIC MASTERY ACCORDION / PILL GRID */}
      <div className="editorial-card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <h3 className="font-grotesk" style={{ fontSize: "1.1rem", textTransform: "uppercase", color: "#FFF" }}>
              TOPIC MASTERY & POINTS
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
              Click any topic to filter the points ledger below
            </p>
          </div>

          {selectedTopic && (
            <button
              onClick={() => setSelectedTopic(null)}
              className="btn-editorial-outline"
              style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}
            >
              Clear Topic Filter: <strong>{selectedTopic}</strong> ✕
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {topicStats.map((t) => {
            const isSelected = selectedTopic === t.topic;
            const pct = Math.round((t.solved / t.total) * 100) || 0;
            return (
              <div
                key={t.topic}
                onClick={() => setSelectedTopic(isSelected ? null : t.topic)}
                style={{
                  background: isSelected ? "rgba(33, 72, 255, 0.15)" : "var(--bg-primary)",
                  border: isSelected ? "1px solid var(--accent-cobalt)" : "1px solid var(--border-editorial)",
                  padding: "0.75rem 1rem",
                  borderRadius: "3px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: isSelected ? "var(--accent-cobalt)" : "#FFF" }}>
                    {t.topic}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-cobalt)", fontWeight: 700 }}>
                    +{t.points} PTS
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                  <span>{t.solved} / {t.total} Solved</span>
                  <span>{pct}%</span>
                </div>
                <div className="progress-bar-bg" style={{ height: "3px" }}>
                  <div
                    className="progress-bar-fill-cobalt"
                    style={{ width: `${pct}%`, background: pct === 100 ? "var(--accent-acid)" : "var(--accent-cobalt)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN ITEMIZED ACHIEVED POINTS LEDGER */}
      <div className="editorial-card" style={{ padding: "2rem" }}>
        {/* Ledger Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <span className="editorial-stamp" style={{ borderColor: "var(--accent-cobalt)", color: "var(--accent-cobalt)", marginBottom: "0.4rem" }}>
              DETAILED TRANSACTION LOG
            </span>
            <h3 className="font-grotesk" style={{ fontSize: "1.3rem", textTransform: "uppercase", color: "#FFF", marginTop: "0.2rem" }}>
              ITEMIZED POINTS LEDGER ({filteredItems.length})
            </h3>
          </div>

          {/* Sort Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: "var(--bg-primary)",
                color: "#FFF",
                border: "1px solid var(--border-editorial)",
                borderRadius: "2px",
                padding: "0.4rem 0.75rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              <option value="NEWEST">Newest First</option>
              <option value="POINTS_DESC">Highest Points</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginBottom: "1.5rem",
            borderBottom: "1px solid var(--border-editorial)",
            paddingBottom: "1.5rem",
          }}
        >
          {/* Search Box */}
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search points by problem title, topic, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 0.9rem 0.75rem 2.4rem",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-editorial)",
                borderRadius: "3px",
                color: "#FFF",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Type Filter Tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button
              onClick={() => setFilterType("ALL")}
              className="btn-editorial-outline"
              style={{
                padding: "0.4rem 0.9rem",
                fontSize: "0.75rem",
                background: filterType === "ALL" ? "var(--accent-cobalt)" : "transparent",
                color: filterType === "ALL" ? "#FFF" : "var(--text-primary)",
                borderColor: filterType === "ALL" ? "var(--accent-cobalt)" : "var(--border-editorial)",
              }}
            >
              All Achieved ({allAchievedPoints.length})
            </button>
            <button
              onClick={() => setFilterType("PROBLEMS")}
              className="btn-editorial-outline"
              style={{
                padding: "0.4rem 0.9rem",
                fontSize: "0.75rem",
                background: filterType === "PROBLEMS" ? "var(--accent-cobalt)" : "transparent",
                color: filterType === "PROBLEMS" ? "#FFF" : "var(--text-primary)",
                borderColor: filterType === "PROBLEMS" ? "var(--accent-cobalt)" : "var(--border-editorial)",
              }}
            >
              Problem Solves ({solvedStatuses.length})
            </button>
            <button
              onClick={() => setFilterType("DAILY")}
              className="btn-editorial-outline"
              style={{
                padding: "0.4rem 0.9rem",
                fontSize: "0.75rem",
                background: filterType === "DAILY" ? "var(--accent-acid)" : "transparent",
                color: filterType === "DAILY" ? "#0A0B10" : "var(--text-primary)",
                borderColor: filterType === "DAILY" ? "var(--accent-acid)" : "var(--border-editorial)",
              }}
            >
              Daily Bonuses ({completedDailies.length})
            </button>
            <button
              onClick={() => setFilterType("DUELS_BADGES")}
              className="btn-editorial-outline"
              style={{
                padding: "0.4rem 0.9rem",
                fontSize: "0.75rem",
                background: filterType === "DUELS_BADGES" ? "var(--accent-amber)" : "transparent",
                color: filterType === "DUELS_BADGES" ? "#0A0B10" : "var(--text-primary)",
                borderColor: filterType === "DUELS_BADGES" ? "var(--accent-amber)" : "var(--border-editorial)",
              }}
            >
              Duels & Badges ({wonDuels.length + userAchievements.length})
            </button>
          </div>

          {/* Secondary Difficulty Filter (When Problem Solves is active or ALL) */}
          {(filterType === "ALL" || filterType === "PROBLEMS") && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                Difficulty:
              </span>
              <button
                onClick={() => setFilterDifficulty("ALL")}
                style={{
                  background: filterDifficulty === "ALL" ? "rgba(245, 242, 235, 0.15)" : "transparent",
                  color: filterDifficulty === "ALL" ? "#FFF" : "var(--text-muted)",
                  border: "1px solid var(--border-editorial)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "2px",
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilterDifficulty("Easy")}
                style={{
                  background: filterDifficulty === "Easy" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                  color: filterDifficulty === "Easy" ? "var(--accent-acid)" : "var(--text-muted)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "2px",
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
              >
                Easy (+10)
              </button>
              <button
                onClick={() => setFilterDifficulty("Medium")}
                style={{
                  background: filterDifficulty === "Medium" ? "rgba(255, 158, 0, 0.2)" : "transparent",
                  color: filterDifficulty === "Medium" ? "var(--accent-amber)" : "var(--text-muted)",
                  border: "1px solid rgba(255, 158, 0, 0.3)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "2px",
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
              >
                Medium (+20)
              </button>
              <button
                onClick={() => setFilterDifficulty("Hard")}
                style={{
                  background: filterDifficulty === "Hard" ? "rgba(255, 55, 20, 0.2)" : "transparent",
                  color: filterDifficulty === "Hard" ? "var(--accent-vermillion)" : "var(--text-muted)",
                  border: "1px solid rgba(255, 55, 20, 0.3)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "2px",
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
              >
                Hard (+30)
              </button>
            </div>
          )}
        </div>

        {/* List of Achieved Points */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚔️</div>
            <div style={{ fontWeight: 700, color: "#FFF", fontSize: "1.1rem", marginBottom: "0.4rem" }}>
              No Achieved Points Found
            </div>
            <p style={{ fontSize: "0.85rem", maxWidth: "450px", margin: "0 auto" }}>
              {allAchievedPoints.length === 0
                ? "You haven't earned points yet. Solve problems from Striver's 191 SDE Sheet or complete daily missions on LeetCode to build your point ledger!"
                : "No point achievements matched your current search and filter criteria. Try clearing your filters."}
            </p>
            {allAchievedPoints.length === 0 ? (
              <Link
                href="/problems"
                className="btn-editorial-primary"
                style={{ marginTop: "1.5rem", display: "inline-flex", fontSize: "0.85rem", padding: "0.6rem 1.2rem" }}
              >
                Open 191 SDE Sheet
              </Link>
            ) : (
              <button
                onClick={() => {
                  setFilterType("ALL");
                  setFilterDifficulty("ALL");
                  setSelectedTopic(null);
                  setSearchQuery("");
                }}
                className="btn-editorial-outline"
                style={{ marginTop: "1.5rem", fontSize: "0.8rem" }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredItems.map((item) => {
              const formattedDate = item.date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = item.date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className="problem-row-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 1.25rem",
                    borderRadius: "4px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-editorial)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* Left: Type Icon & Details */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: "240px" }}>
                    {/* Point Badge Icon */}
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          item.type === "PROBLEM"
                            ? item.difficulty === "Easy"
                              ? "rgba(16, 185, 129, 0.12)"
                              : item.difficulty === "Hard"
                              ? "rgba(255, 55, 20, 0.12)"
                              : "rgba(255, 158, 0, 0.12)"
                            : item.type === "DAILY_BONUS"
                            ? "rgba(16, 185, 129, 0.15)"
                            : item.type === "DUEL"
                            ? "rgba(255, 55, 20, 0.15)"
                            : "rgba(33, 72, 255, 0.15)",
                        border:
                          item.type === "PROBLEM"
                            ? item.difficulty === "Easy"
                              ? "1px solid rgba(16, 185, 129, 0.3)"
                              : item.difficulty === "Hard"
                              ? "1px solid rgba(255, 55, 20, 0.3)"
                              : "1px solid rgba(255, 158, 0, 0.3)"
                            : "1px solid var(--border-editorial-strong)",
                        fontSize: "1.2rem",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon || (item.type === "PROBLEM" ? <CheckCircle2 size={20} color={item.difficulty === "Easy" ? "var(--accent-acid)" : item.difficulty === "Hard" ? "var(--accent-vermillion)" : "var(--accent-amber)"} /> : <Zap size={20} color="var(--accent-cobalt)" />)}
                    </div>

                    {/* Title & Metadata */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                        {item.problemId ? (
                          <Link
                            href={`/problems/${item.problemId}`}
                            style={{
                              fontWeight: 700,
                              color: "#FFF",
                              fontSize: "0.95rem",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <span>{item.title}</span>
                            <ArrowUpRight size={13} color="var(--accent-cobalt)" />
                          </Link>
                        ) : (
                          <span style={{ fontWeight: 700, color: "#FFF", fontSize: "0.95rem" }}>
                            {item.title}
                          </span>
                        )}

                        {item.difficulty && (
                          <span
                            className={
                              item.difficulty === "Easy"
                                ? "badge-diff-easy"
                                : item.difficulty === "Hard"
                                ? "badge-diff-hard"
                                : "badge-diff-medium"
                            }
                            style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}
                          >
                            {item.difficulty}
                          </span>
                        )}

                        {item.tagLabel && !item.difficulty && (
                          <span
                            className="editorial-stamp"
                            style={{
                              fontSize: "0.65rem",
                              padding: "0.1rem 0.4rem",
                              borderColor: "var(--border-editorial)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {item.tagLabel}
                          </span>
                        )}
                      </div>

                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Right: Points Badge & Timestamp */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      className="font-serif"
                      style={{
                        fontSize: "1.4rem",
                        color:
                          item.type === "DAILY_BONUS"
                            ? "var(--accent-acid)"
                            : item.type === "DUEL"
                            ? "var(--accent-vermillion)"
                            : item.type === "ACHIEVEMENT"
                            ? "var(--accent-amber)"
                            : "var(--accent-cobalt)",
                        lineHeight: 1,
                        fontWeight: 700,
                      }}
                    >
                      +{item.points}{" "}
                      <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>PTS</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
                      {formattedDate} • {formattedTime}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
