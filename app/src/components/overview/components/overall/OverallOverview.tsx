import React from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Grid,
	Chip,
	AccordionDetails,
	Accordion,
	AccordionSummary,
} from "@mui/material";
import { ExpandMore, Thermostat } from "@mui/icons-material";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	BarChart,
	Bar,
} from "recharts";
import type { OverallStats } from "../../types/OverallStats";
import type { BabyEntry, DayStats } from "../../../../interfaces";
import dayjs from "dayjs";

interface OverallOverviewProps {
	entries: BabyEntry[];
	loading: boolean;
}

const OverallOverview: React.FC<OverallOverviewProps> = ({
	entries,
	loading,
}) => {
	const getAvailableDates = (): string[] => {
		const dates = [...new Set(entries.map((entry) => entry.date))];
		return dates.sort().reverse();
	};

	const getDateStats = (date: string): DayStats => {
		const dayEntries = entries.filter((entry) => entry.date === date);

		return {
			totalFeedings: dayEntries.length,
			bottleFeeds: dayEntries.filter((e) => e.feedType === "BOTTLE").length,
			breastFeeds: dayEntries.filter((e) => e.feedType === "BREAST").length,
			leftBreastFeeds: dayEntries.filter(
				(e) => e.feedType === "BREAST" && e.startingBreast === "LEFT"
			).length,
			rightBreastFeeds: dayEntries.filter(
				(e) => e.feedType === "BREAST" && e.startingBreast === "RIGHT"
			).length,
			totalPees: dayEntries.filter((e) => e.didPee).length,
			totalPoos: dayEntries.filter((e) => e.didPoo).length,
			totalThrowUps: dayEntries.filter((e) => e.didThrowUp).length,
			avgTemperature:
				dayEntries.filter((e) => e.temperature).length > 0
					? (
							dayEntries
								.filter((e) => e.temperature)
								.reduce((sum, e) => sum + (e.temperature || 0), 0) /
							dayEntries.filter((e) => e.temperature).length
					  ).toFixed(1)
					: null,
			entries: dayEntries.sort((a, b) => a.time.localeCompare(b.time)),
		};
	};

	const getOverallStats = (): OverallStats => {
		const availableDates = getAvailableDates();
		const dailyBreakdown = availableDates.map((date) => ({
			date,
			stats: getDateStats(date),
		}));

		const totalDays = availableDates.length;
		const totalFeedings = entries.length;
		const bottleFeeds = entries.filter((e) => e.feedType === "BOTTLE").length;
		const breastFeeds = entries.filter((e) => e.feedType === "BREAST").length;
		const leftBreastFeeds = entries.filter(
			(e) => e.feedType === "BREAST" && e.startingBreast === "LEFT"
		).length;
		const rightBreastFeeds = entries.filter(
			(e) => e.feedType === "BREAST" && e.startingBreast === "RIGHT"
		).length;
		const totalPees = entries.filter((e) => e.didPee).length;
		const totalPoos = entries.filter((e) => e.didPoo).length;
		const totalThrowUps = entries.filter((e) => e.didThrowUp).length;

		const temperaturesEntries = entries.filter((e) => e.temperature);
		const avgTemperature =
			temperaturesEntries.length > 0
				? (
						temperaturesEntries.reduce(
							(sum, e) => sum + (e.temperature || 0),
							0
						) / temperaturesEntries.length
				  ).toFixed(1)
				: null;

		return {
			totalDays,
			totalFeedings,
			avgFeedingsPerDay:
				totalDays > 0 ? Math.round((totalFeedings / totalDays) * 10) / 10 : 0,
			bottleFeeds,
			breastFeeds,
			leftBreastFeeds,
			rightBreastFeeds,
			totalPees,
			totalPoos,
			totalThrowUps,
			avgPeesPerDay:
				totalDays > 0 ? Math.round((totalPees / totalDays) * 10) / 10 : 0,
			avgPoosPerDay:
				totalDays > 0 ? Math.round((totalPoos / totalDays) * 10) / 10 : 0,
			avgThrowUpsPerDay:
				totalDays > 0 ? Math.round((totalThrowUps / totalDays) * 10) / 10 : 0,
			avgTemperature,
			dailyBreakdown,
		};
	};

	// Prepare chart data
	const getChartData = () => {
		const availableDates = getAvailableDates();
		return availableDates
			.reverse() // Show chronological order in chart
			.map((date) => {
				const stats = getDateStats(date);
				return {
					date: dayjs(date).format("MM/DD"),
					fullDate: date,
					feeds: stats.totalFeedings,
					bottle: stats.bottleFeeds,
					breast: stats.breastFeeds,
					pees: stats.totalPees,
					poos: stats.totalPoos,
					throwUps: stats.totalThrowUps,
					temperature: stats.avgTemperature
						? parseFloat(stats.avgTemperature)
						: null,
				};
			});
	};

	const overallStats = getOverallStats();
	const chartData = getChartData();

	if (loading) {
		return (
			<Typography variant="h6" color="text.secondary" textAlign="center" py={4}>
				Loading overall statistics...
			</Typography>
		);
	}

	return (
		<Box>
			{/* Charts Section */}
			<Grid container spacing={3} sx={{ mb: 4 }}>
				{/* Daily Activity Trend */}
				<Grid size={{ xs: 12, lg: 8 }}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								Daily Activity Trends
							</Typography>
							<ResponsiveContainer width="100%" height={300}>
								<LineChart data={chartData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip
										labelFormatter={(value, payload) => {
											const item = payload?.[0]?.payload;
											return item
												? dayjs(item.fullDate).format("MMMM D, YYYY")
												: value;
										}}
									/>
									<Legend />
									<Line
										type="monotone"
										dataKey="feeds"
										stroke="#1976d2"
										strokeWidth={2}
										name="Total Feeds"
									/>
									<Line
										type="monotone"
										dataKey="pees"
										stroke="#0288d1"
										strokeWidth={2}
										name="Pees"
									/>
									<Line
										type="monotone"
										dataKey="poos"
										stroke="#f57c00"
										strokeWidth={2}
										name="Poos"
									/>
									{chartData.some((d) => d.throwUps > 0) && (
										<Line
											type="monotone"
											dataKey="throwUps"
											stroke="#d32f2f"
											strokeWidth={2}
											name="Throw Ups"
										/>
									)}
								</LineChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</Grid>

				{/* Feed Type Breakdown */}
				<Grid size={{ xs: 12, lg: 4 }}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								Feeding Types Over Time
							</Typography>
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={chartData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip
										labelFormatter={(value, payload) => {
											const item = payload?.[0]?.payload;
											return item
												? dayjs(item.fullDate).format("MMMM D, YYYY")
												: value;
										}}
									/>
									<Legend />
									<Bar
										dataKey="bottle"
										stackId="feeds"
										fill="#1976d2"
										name="Bottle"
									/>
									<Bar
										dataKey="breast"
										stackId="feeds"
										fill="#7b1fa2"
										name="Breast"
									/>
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</Grid>

				{/* Temperature Chart - Only show if there's temperature data */}
				{chartData.some((d) => d.temperature !== null) && (
					<Grid size={{ xs: 12 }}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Temperature Trend
								</Typography>
								<ResponsiveContainer width="100%" height={200}>
									<LineChart data={chartData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" />
										<YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} />
										<Tooltip
											labelFormatter={(value, payload) => {
												const item = payload?.[0]?.payload;
												return item
													? dayjs(item.fullDate).format("MMMM D, YYYY")
													: value;
											}}
											formatter={(value) => [`${value}°C`, "Temperature"]}
										/>
										<Line
											type="monotone"
											dataKey="temperature"
											stroke="#f57c00"
											strokeWidth={2}
											name="Temperature (°C)"
											connectNulls={false}
											dot={{ fill: "#f57c00", strokeWidth: 2, r: 4 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</Grid>
				)}
			</Grid>

			{/* Summary Stats Cards */}
			<Grid container spacing={2} sx={{ mb: 3 }}>
				<Grid size={{ xs: 12, sm: 3 }}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom color="primary">
								Feeding Breakdown
							</Typography>
							<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
								<Chip
									label={`Bottle: ${overallStats.bottleFeeds}`}
									color="primary"
									variant="outlined"
								/>
								<Chip
									label={`Breast: ${overallStats.breastFeeds}`}
									color="secondary"
									variant="outlined"
								/>
							</Box>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
								Total: {overallStats.totalFeedings} feeds over{" "}
								{overallStats.totalDays} days
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				{overallStats.breastFeeds > 0 && (
					<Grid size={{ xs: 12, sm: 3 }}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom color="secondary">
									Breast Preference
								</Typography>
								<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
									<Chip
										label={`Left: ${overallStats.leftBreastFeeds}`}
										color="secondary"
										variant="outlined"
									/>
									<Chip
										label={`Right: ${overallStats.rightBreastFeeds}`}
										color="secondary"
										variant="outlined"
									/>
								</Box>
							</CardContent>
						</Card>
					</Grid>
				)}

				<Grid size={{ xs: 12, sm: 3 }}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom color="info">
								Daily Averages
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Feeds: {overallStats.avgFeedingsPerDay}/day
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Pees: {overallStats.avgPeesPerDay}/day
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Poos: {overallStats.avgPoosPerDay}/day
							</Typography>
							{overallStats.avgThrowUpsPerDay > 0 && (
								<Typography variant="body2" color="text.secondary">
									Throw Ups: {overallStats.avgThrowUpsPerDay}/day
								</Typography>
							)}
						</CardContent>
					</Card>
				</Grid>

				{overallStats.avgTemperature && (
					<Grid size={{ xs: 12, sm: 3 }}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Average Temperature
								</Typography>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Thermostat color="warning" />
									<Typography variant="h5" color="warning.main">
										{overallStats.avgTemperature}°C
									</Typography>
								</Box>
							</CardContent>
						</Card>
					</Grid>
				)}
			</Grid>

			{/* Daily Breakdown Accordion */}
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						Daily Breakdown
					</Typography>
					{overallStats.dailyBreakdown.map(({ date, stats }) => (
						<Accordion key={date}>
							<AccordionSummary expandIcon={<ExpandMore />}>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 2,
										width: "100%",
									}}
								>
									<Typography variant="subtitle1" fontWeight="bold">
										{dayjs(date).format("MMMM D, YYYY")}
									</Typography>
									<Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
										<Chip
											label={`${stats.totalFeedings} feeds`}
											size="small"
											color="primary"
											variant="outlined"
										/>
										<Chip
											label={`${stats.totalPees} pees`}
											size="small"
											color="info"
											variant="outlined"
										/>
										<Chip
											label={`${stats.totalPoos} poos`}
											size="small"
											color="warning"
											variant="outlined"
										/>
									</Box>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								<Grid container spacing={2}>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Feeds
										</Typography>
										<Typography variant="h6">{stats.totalFeedings}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Bottle
										</Typography>
										<Typography variant="h6">{stats.bottleFeeds}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Breast
										</Typography>
										<Typography variant="h6">{stats.breastFeeds}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Pees
										</Typography>
										<Typography variant="h6">{stats.totalPees}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Poos
										</Typography>
										<Typography variant="h6">{stats.totalPoos}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Throw Ups
										</Typography>
										<Typography variant="h6">{stats.totalThrowUps}</Typography>
									</Grid>
								</Grid>
								{stats.avgTemperature && (
									<Box sx={{ mt: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Average Temperature: {stats.avgTemperature}°C
										</Typography>
									</Box>
								)}
							</AccordionDetails>
						</Accordion>
					))}
				</CardContent>
			</Card>
		</Box>
	);
};

export default OverallOverview;
