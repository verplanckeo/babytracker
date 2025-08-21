import type { DayStats } from "../../../interfaces";

export interface OverallStats {
	totalDays: number;
	totalFeedings: number;
	avgFeedingsPerDay: number;
	bottleFeeds: number;
	breastFeeds: number;
	leftBreastFeeds: number;
	rightBreastFeeds: number;
	totalPees: number;
	totalPoos: number;
	totalThrowUps: number;
	avgPeesPerDay: number;
	avgPoosPerDay: number;
	avgThrowUpsPerDay: number;
	avgTemperature: string | null;
	dailyBreakdown: { date: string; stats: DayStats }[];
}