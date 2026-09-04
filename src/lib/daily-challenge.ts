import {
  getTeamDailyProblemBatch,
  getOrCreateDailyChallenge,
  calculateTeamPhaseInfo,
  calculatePhaseWinners,
  TeamDailyBatch,
  TeamPhaseInfo,
} from "./team-phase";

export interface GlobalDailyBatch {
  dayNumber: number;
  batchStartOrder: number;
  problems: any[];
  totalCount: number;
  isSeasonComplete: boolean;
  todayStr: string;
  nextResetIso: string;
  phase?: 1 | 2;
  phaseDay?: number;
  overallDay?: number;
}

export async function getGlobalDailyProblemBatch(
  customDateOrGroup?: any,
  customDateStr?: string
): Promise<GlobalDailyBatch> {
  let targetGroupOrDate = customDateOrGroup;
  let targetDate = customDateStr;

  if (typeof customDateOrGroup === "string" && customDateOrGroup.includes("-")) {
    targetGroupOrDate = null;
    targetDate = customDateOrGroup;
  }

  const batch = await getTeamDailyProblemBatch(targetGroupOrDate, targetDate);

  return {
    dayNumber: batch.overallDay,
    batchStartOrder: batch.batchStartOrder,
    problems: batch.problems,
    totalCount: batch.totalCount,
    isSeasonComplete: batch.isCompetitionComplete,
    todayStr: batch.todayStr,
    nextResetIso: batch.nextResetIso,
    phase: batch.phase,
    phaseDay: batch.phaseDay,
    overallDay: batch.overallDay,
  };
}

export {
  getOrCreateDailyChallenge,
  getTeamDailyProblemBatch,
  calculateTeamPhaseInfo,
  calculatePhaseWinners,
};
